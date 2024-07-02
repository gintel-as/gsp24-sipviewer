import json, re
from collections import defaultdict

class LogInterpreter:
    
    def createStartLineDict(self, time, sessionID, messageID, direction, party, method):
        startLineDict = {
            "time": time,
            "sessionID": sessionID,
            "messageID": messageID,
            "direction": direction,
            "party": party,
            "method": method # Method is the type of message (e.g., INVITE)
        }
        return startLineDict
    
    def createSipHeaderDict(self, method, sipTo, sipFrom, content):
        sipHeaderDict = {
            "method": method,
            "to": sipTo,
            "from": sipFrom,
            "content": content
        }
        return sipHeaderDict
    
    def createBodyDict(self, content):
        bodyDict = {
            "content": content
        }
        return bodyDict

    def createPacketDict(self, startLineDict, sipHeaderDict, bodyDict):
        packetDict = {
            "startLine": startLineDict,
            "sipHeader": sipHeaderDict,
            "body": bodyDict 
        }
        return packetDict
    
    def extractHeader(self, sipHeader):
        sipContent = defaultdict(list)
        pattern = r'^([A-Za-z0-9.-]+)(?:\s*(sip:|:)\s*)(.*)$'
        sipContent["Header"].append(sipHeader[0])
        for i in range(1,len(sipHeader)):
            x = sipHeader[i]
            if x != "":
                try:
                    match = re.match(pattern, x)
                    sipContent[match.group(1)].append(match.group(3))
                except:
                    sipContent['Unreadable Line'].append(x)
        method = self.findStartLine(sipContent, sipHeader)
        return method, sipContent


    # Find message type if message is response (e.g., INVITE, BYE etc.) and remove excess information (e.g., sip:4794001002@192.168.56.1:60129)
    def findStartLine(self, sipContent, header):
        startLineEntry = sipContent["Header"][0]
        method = ""

        # If message is response remove excess information and add message type from CSeq 
        if startLineEntry.startswith('SIP/2.0'):
            responsePattern = r'.* (\d{3} .*)'
            responseMatch = re.match(responsePattern, startLineEntry)
            if responseMatch:
                method = responseMatch.group(1)

            CseqValue = sipContent['CSeq'][0]
            startLineCseq = ""
            for char in CseqValue:
                if char.isalpha():
                    startLineCseq += char
            method = method + ' (' + startLineCseq + ')'
            return method
           
            

        # If message is request, remove excess information
        elif startLineEntry.endswith('SIP/2.0'):
            requestPattern = r'^(ACK|PRACK|INVITE|BYE|CANCEL|UPDATE|INFO|SUBSCRIBE|NOTIFY|REFER|MESSAGE|OPTIONS|PUBLISH|REGISTER) .*'
            requestMatch = re.match(requestPattern, startLineEntry)
            if requestMatch:
                method = requestMatch.group(1)
                return method 



    # Separate SIP header and body when body exsist
    # def separateHeaderAndBody(self, header):
    #     contentLength = None
    #     bodyExists = False
    #     for x in header:
    #         if x.startswith("Content-Length:"):
    #             contentLength = x

    #     _, numberStr = contentLength.split(":")
    #     contentLengthValue = int(numberStr)
    #     if contentLengthValue > 0:
    #         bodyExists = True

    #     pattern = r'^[A-Za-z0-9.-]+: .*'

    #     sipHeader = []
    #     bodyElements = []
    #     if bodyExists:
    #         sipHeader.append(header.pop(0))
    #         for x in header:
    #             if re.match(pattern, x):
    #                 sipHeader.append(x)
    #             else:
    #                 bodyElements.append(x)
    #     else:
    #         sipHeader = header

    #     return sipHeader, bodyElements
    
    
    def interpretStartLineString(self, startLineString):
        pattern = r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3}) .* (\d+|NoRefNo) .* id=([A-Fa-f0-9]+) (to|from) (\w+)'
        match = re.match(pattern, startLineString)
        timestamp = match.group(1)
        sessionId = match.group(2)
        messageId = match.group(3)
        direction = match.group(4)
        party = match.group(5)
        if party == "NULL":
            party = 'Not Identified'
        return timestamp, sessionId, messageId, direction, party

    def createJsonPacket(self, time, sessionID, messageID, direction, party, method, sipContent, body):
        startLineDict = self.createStartLineDict(time, sessionID, messageID, direction, party, method)
        sipHeaderDict = dict(sipContent)
        bodyDict = self.createBodyDict(body)
        packetDict = self.createPacketDict(startLineDict, sipHeaderDict, bodyDict)
        return packetDict
    
    def createJsonPacketsFromExtractedHeaders(self, startLines, headers, body): 
        jsonPackets = []
        for i in range(len(startLines)):
            #### Ideally maybe keep the code below, not try catch, however try/catch is very functional but does not communicate ### 

            # time, sessionID, messageID, direction, party = self.interpretStartLineString(startLines[i])
            # method, sipContent, body = self.extractHeader(headers[i])
            # jsonPct = self.createJsonPacket(time, sessionID, messageID, direction, party, method, sipContent, body)
            # jsonPackets.append(jsonPct)
            try:
                time, sessionID, messageID, direction, party = self.interpretStartLineString(startLines[i])
                method, sipContent= self.extractHeader(headers[i])
                jsonPct = self.createJsonPacket(time, sessionID, messageID, direction, party, method, sipContent, body[i])
                jsonPackets.append(jsonPct)
            except Exception as e:
                print("Packet not included due to error")
                print(e)
            
            
        return json.dumps(jsonPackets, indent=2)
    
    def writeJsonFileFromHeaders(self, startLines, headers, body, filePath):
        f = open(filePath, "w")
        jsonText = self.createJsonPacketsFromExtractedHeaders(startLines, headers, body)
        f.write(jsonText)
        f.close()




if __name__ == "__main__":  
    logInterpreter = LogInterpreter()
    startLines = ['2024-06-05 10:52:02.446 DEBUG [or.sip.gen.SipLogMgr][Thread-7] 104328762 Received message with id=E5D71B08 from LegA', '2024-06-05 10:52:02.525 DEBUG [or.sip.gen.SipLogMgr][Thread-7] 104328762 Sending message with id=E5D71B09 to LegB', '2024-06-05 10:52:02.699 DEBUG [or.sip.gen.SipLogMgr][Thread-8] 104328762 Received message with id=E5D71B0A from LegB']


    headers = [['INVITE sip:4794001002@192.168.56.111;user=phone SIP/2.0', 'Record-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525;did=82f.f488142>', 'Via: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK4b7b.b8a4c295.0', 'Via: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj0d59e3092ef347b0941a21790d0dcc2f', 'Max-Forwards: 69', 'From: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525', 'To: <sip:4794001002@192.168.56.112>', 'Contact: "44779790101-VM" <sip:44779790101@192.168.56.1:64489;ob>', 'Call-ID: 7aa1d274185a463694dad4ad56aa5bf0', 'CSeq: 21343 INVITE', 'Allow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS', 'Supported: replaces,100rel,timer,norefersub', 'Session-Expires: 1800', 'Min-SE: 90', 'User-Agent: MicroSIP/3.20.7', 'Content-Type: application/sdp', 'Remote-Party-ID: "44779790101" <sip:44779790101@0.0.0.0>;party=calling;id-type=subscriber;privacy=off;screen=no', 'Content-Length: 340'], ['INVITE sip:4794001002@192.168.56.112:5060;user=phone SIP/2.0', 'From: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff', 'To: "4794001002" <sip:4794001002@192.168.56.112;user=phone>', 'CSeq: 21343 INVITE', 'Allow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS', 'User-Agent: MicroSIP/3.20.7', 'Remote-Party-ID: "44779790101" <sip:44779790101@0.0.0.0>;party=calling;id-type=subscriber;privacy=off;screen=no', 'Call-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111', 'Route: <sip:192.168.56.112:5060;lr>', 'Via: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_21505e85-9471-4e8c-9fea-e3dfd9c2676e', 'Contact: <sip:44779790101@192.168.56.111:5060;ob>', 'Max-Forwards: 68', 'X-Gt-MBN-Served-User: <sip:+4794001002@192.168.56.111:5060;sno=MBNInbound;cid=153;type=HuntConnect;desttype=EndUser;anumindicator=0>', 'X-Gt-MBN-SessionId: 104328762', 'Content-Type: application/sdp', 'Session-Expires: 90', 'Min-SE: 90', 'Supported: replaces,100rel,timer,norefersub', 'Content-Length: 340'], ['SIP/2.0 100 Giving a try', 'From: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff', 'To: "4794001002" <sip:4794001002@192.168.56.112;user=phone>', 'CSeq: 21343 INVITE', 'Call-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111', 'Via: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_21505e85-9471-4e8c-9fea-e3dfd9c2676e', 'Server: OpenSIPS (2.4.11 (x86_64/linux))', 'Content-Length: 0', '', '']]

    body = [[ 'v=0', 'o=- 3926573523 3926573523 IN IP4 10.254.8.178', 's=pjmedia', 'b=AS:84', 't=0 0', 'a=X-nat:0', 'm=audio 4002 RTP/AVP 8 0 101', 'c=IN IP4 10.254.8.178', 'b=TIAS:64000', 'a=rtcp:4003 IN IP4 10.254.8.178', 'a=sendrecv', 'a=rtpmap:8 PCMA/8000', 'a=rtpmap:0 PCMU/8000', 'a=rtpmap:101 telephone-event/8000', 'a=fmtp:101 0-16', 'a=ssrc:1932486814 cname:1af30a2f01e36ab9', ''], ['v=0', 'o=- 3926573523 3926573523 IN IP4 10.254.8.178', 's=pjmedia', 'b=AS:84', 't=0 0', 'a=X-nat:0', 'm=audio 4002 RTP/AVP 8 0 101', 'c=IN IP4 10.254.8.178', 'b=TIAS:64000', 'a=rtcp:4003 IN IP4 10.254.8.178', 'a=sendrecv', 'a=rtpmap:8 PCMA/8000', 'a=rtpmap:0 PCMU/8000', 'a=rtpmap:101 telephone-event/8000', 'a=fmtp:101 0-16', 'a=ssrc:1932486814 cname:1af30a2f01e36ab9', ''], ['']]
    filePath = "./json/test.json"
    logInterpreter.writeJsonFileFromHeaders(startLines, headers, body, filePath)