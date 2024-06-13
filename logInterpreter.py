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
    
    def extractHeader(self, header):
        sipHeader, bodyElements = self.separateHeaderAndBody(header)
        sipContent = defaultdict(list)
        pattern = r'(^[A-Za-z-]+): (.*)'
        sipContent["Header"].append(sipHeader[0])
        for i in range(1,len(sipHeader)):
            x = sipHeader[i]
            if x != "":
                match = re.match(pattern, x)
                sipContent[match.group(1)].append(match.group(2))
        method = self.findStartLine(sipContent, header)
        return method, sipContent, bodyElements  
    

    # Find message type if message is response (e.g., INVITE, BYE etc.) and remove excess information (e.g., sip:4794001002@192.168.56.1:60129)
    def findStartLine(self, sipContent, header):
        startLineEntry = header[0]
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
    def separateHeaderAndBody(self, header):
        contentLength = None
        bodyExists = False
        for x in header:
            if x.startswith("Content-Length:"):
                contentLength = x

        _, numberStr = contentLength.split(":")
        contentLengthValue = int(numberStr)
        if contentLengthValue > 0:
            bodyExists = True

        sipHeader = []
        bodyElements = []
        if bodyExists:
            for x in header:
                if len(x) >= 2 and x[1] == '=':
                    bodyElements.append(x)
                else:
                    sipHeader.append(x)
        else:
            sipHeader = header


        return sipHeader, bodyElements
    
    def interpretStartLineString(self, startLineString):
        pattern = r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3}) .* (\d+) .* id=([A-Fa-f0-9]+) (to|from) (\w+)'
        match = re.match(pattern, startLineString)
        timestamp = match.group(1)
        sessionId = match.group(2)
        messageId = match.group(3)
        direction = match.group(4)
        party = match.group(5)
        return timestamp, sessionId, messageId, direction, party

    def createJsonPacket(self, time, sessionID, messageID, direction, party, method, sipContent, body):
        startLineDict = self.createStartLineDict(time, sessionID, messageID, direction, party, method)
        sipHeaderDict = dict(sipContent)
        bodyDict = self.createBodyDict(body)
        packetDict = self.createPacketDict(startLineDict, sipHeaderDict, bodyDict)
        return packetDict
    
    def createJsonPacketsFromExtractedHeaders(self, startLines, headers): 
        jsonPackets = []
        for i in range(len(startLines)):
            time, sessionID, messageID, direction, party = self.interpretStartLineString(startLines[i])
            method, sipContent, body = self.extractHeader(headers[i])
            jsonPct = self.createJsonPacket(time, sessionID, messageID, direction, party, method, sipContent, body)
            jsonPackets.append(jsonPct)
        return json.dumps(jsonPackets, indent=2)
    
    def writeJsonFileFromHeaders(self, startLines, headers, filePath):
        f = open(filePath, "w")
        jsonText = self.createJsonPacketsFromExtractedHeaders(startLines, headers)
        f.write(jsonText)
        f.close()
    
    
if __name__ == "__main__":  
    logInterpreter = LogInterpreter()
    startLines = ['2024-06-05 10:52:02.446 DEBUG [or.sip.gen.SipLogMgr][Thread-7] 104328762 Received message with id=E5D71B08 from LegA', '2024-06-05 10:52:02.525 DEBUG [or.sip.gen.SipLogMgr][Thread-7] 104328762 Sending message with id=E5D71B09 to LegB', '2024-06-05 10:52:02.699 DEBUG [or.sip.gen.SipLogMgr][Thread-8] 104328762 Received message with id=E5D71B0A from LegB', '2024-06-05 10:52:02.748 DEBUG [or.sip.gen.SipLogMgr][Thread-9] 104328762 Received message with id=E5D71B0B from LegB', '2024-06-05 10:52:02.772 DEBUG [or.sip.gen.SipLogMgr][Thread-9] 104328762 Sending message with id=E5D71B0C to LegA', '2024-06-05 10:52:06.078 DEBUG [or.sip.gen.SipLogMgr][hread-12] 104328762 Received message with id=E5D71B0D from LegB', '2024-06-05 10:52:06.130 DEBUG [or.sip.gen.SipLogMgr][hread-12] 104328762 Sending message with id=E5D71B0E to LegA', '2024-06-05 10:52:06.180 DEBUG [or.sip.gen.SipLogMgr][hread-13] 104328762 Received message with id=E5D71B0F from LegA', '2024-06-05 10:52:06.197 DEBUG [or.sip.gen.SipLogMgr][hread-13] 104328762 Sending message with id=E5D71B10 to LegB', '2024-06-05 10:52:12.990 DEBUG [or.sip.gen.SipLogMgr][hread-14] 104328762 Received message with id=E5D71B11 from LegA', '2024-06-05 10:52:12.997 DEBUG [or.sip.gen.SipLogMgr][hread-14] 104328762 Sending message with id=E5D71B12 to LegA', '2024-06-05 10:52:13.018 DEBUG [or.sip.gen.SipLogMgr][hread-14] 104328762 Sending message with id=E5D71B13 to LegB', '2024-06-05 10:52:13.072 DEBUG [or.sip.gen.SipLogMgr][hread-15] 104328762 Received message with id=E5D71B14 from LegB']


    headers = [['INVITE sip:4794001002@192.168.56.111;user=phone SIP/2.0', 'Record-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525;did=82f.f488142>', 'Via: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK4b7b.b8a4c295.0', 'Via: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj0d59e3092ef347b0941a21790d0dcc2f', 'Max-Forwards: 69', 'From: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525', 'To: <sip:4794001002@192.168.56.112>', 'Contact: "44779790101-VM" <sip:44779790101@192.168.56.1:64489;ob>', 'Call-ID: 7aa1d274185a463694dad4ad56aa5bf0', 'CSeq: 21343 INVITE', 'Allow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS', 'Supported: replaces,100rel,timer,norefersub', 'Session-Expires: 1800', 'Min-SE: 90', 'User-Agent: MicroSIP/3.20.7', 'Content-Type: application/sdp', 'Remote-Party-ID: "44779790101" <sip:44779790101@0.0.0.0>;party=calling;id-type=subscriber;privacy=off;screen=no', 'Content-Length: 340', '', 'v=0', 'o=- 3926573523 3926573523 IN IP4 10.254.8.178', 's=pjmedia', 'b=AS:84', 't=0 0', 'a=X-nat:0', 'm=audio 4002 RTP/AVP 8 0 101', 'c=IN IP4 10.254.8.178', 'b=TIAS:64000', 'a=rtcp:4003 IN IP4 10.254.8.178', 'a=sendrecv', 'a=rtpmap:8 PCMA/8000', 'a=rtpmap:0 PCMU/8000', 'a=rtpmap:101 telephone-event/8000', 'a=fmtp:101 0-16', 'a=ssrc:1932486814 cname:1af30a2f01e36ab9', ''], ['INVITE sip:4794001002@192.168.56.112:5060;user=phone SIP/2.0', 'From: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff', 'To: "4794001002" <sip:4794001002@192.168.56.112;user=phone>', 'CSeq: 21343 INVITE', 'Allow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS', 'User-Agent: MicroSIP/3.20.7', 'Remote-Party-ID: "44779790101" <sip:44779790101@0.0.0.0>;party=calling;id-type=subscriber;privacy=off;screen=no', 'Call-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111', 'Route: <sip:192.168.56.112:5060;lr>', 'Via: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_21505e85-9471-4e8c-9fea-e3dfd9c2676e', 'Contact: <sip:44779790101@192.168.56.111:5060;ob>', 'Max-Forwards: 68', 'X-Gt-MBN-Served-User: <sip:+4794001002@192.168.56.111:5060;sno=MBNInbound;cid=153;type=HuntConnect;desttype=EndUser;anumindicator=0>', 'X-Gt-MBN-SessionId: 104328762', 'Content-Type: application/sdp', 'Session-Expires: 90', 'Min-SE: 90', 'Supported: replaces,100rel,timer,norefersub', 'Content-Length: 340', '', 'v=0', 'o=- 3926573523 3926573523 IN IP4 10.254.8.178', 's=pjmedia', 'b=AS:84', 't=0 0', 'a=X-nat:0', 'm=audio 4002 RTP/AVP 8 0 101', 'c=IN IP4 10.254.8.178', 'b=TIAS:64000', 'a=rtcp:4003 IN IP4 10.254.8.178', 'a=sendrecv', 'a=rtpmap:8 PCMA/8000', 'a=rtpmap:0 PCMU/8000', 'a=rtpmap:101 telephone-event/8000', 'a=fmtp:101 0-16', 'a=ssrc:1932486814 cname:1af30a2f01e36ab9', ''], ['SIP/2.0 100 Giving a try', 'From: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff', 'To: "4794001002" <sip:4794001002@192.168.56.112;user=phone>', 'CSeq: 21343 INVITE', 'Call-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111', 'Via: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_21505e85-9471-4e8c-9fea-e3dfd9c2676e', 'Server: OpenSIPS (2.4.11 (x86_64/linux))', 'Content-Length: 0', '', ''], ['SIP/2.0 180 Ringing', 'Via: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_21505e85-9471-4e8c-9fea-e3dfd9c2676e', 'Record-Route: <sip:192.168.56.112;lr;ftag=21075484_e95e2fe2_f42f003e_1402ffff;did=c12.3a3df197>', 'Call-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111', 'From: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff', 'To: "4794001002" <sip:4794001002@192.168.56.112;user=phone>;tag=a1ea84fc683b4245aa9e244ca0fb73e0', 'CSeq: 21343 INVITE', 'Contact: <sip:4794001002@192.168.56.1:60129;ob>', 'Allow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS', 'Content-Length: 0', '', ''], ['SIP/2.0 180 Ringing', 'CSeq: 21343 INVITE', 'Call-ID: 7aa1d274185a463694dad4ad56aa5bf0', 'From: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525', 'To: <sip:4794001002@192.168.56.112>;tag=68947609_e95e2fe2_f42f003e_1402ffff', 'Via: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK4b7b.b8a4c295.0', 'Via: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj0d59e3092ef347b0941a21790d0dcc2f', 'Record-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525;did=82f.f488142>', 'Server: Gintel TelScale/312061d8e', 'Contact: <sip:192.168.56.111:5060>', 'Allow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS', 'Content-Length: 0', '', ''], ['SIP/2.0 200 OK', 'Via: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_21505e85-9471-4e8c-9fea-e3dfd9c2676e', 'Record-Route: <sip:192.168.56.112;lr;ftag=21075484_e95e2fe2_f42f003e_1402ffff;did=c12.3a3df197>', 'Call-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111', 'From: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff', 'To: "4794001002" <sip:4794001002@192.168.56.112;user=phone>;tag=a1ea84fc683b4245aa9e244ca0fb73e0', 'CSeq: 21343 INVITE', 'Allow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS', 'Contact: <sip:4794001002@192.168.56.1:60129;ob>', 'Supported: replaces,100rel,timer,norefersub', 'Session-Expires: 90;refresher=uac', 'Require: timer', 'Content-Type: application/sdp', 'Content-Length: 313', '', 'v=0', 'o=- 3926573523 3926573524 IN IP4 10.254.8.178', 's=pjmedia', 'b=AS:84', 't=0 0', 'a=X-nat:0', 'm=audio 4000 RTP/AVP 8 101', 'c=IN IP4 10.254.8.178', 'b=TIAS:64000', 'a=rtcp:4001 IN IP4 10.254.8.178', 'a=sendrecv', 'a=rtpmap:8 PCMA/8000', 'a=rtpmap:101 telephone-event/8000', 'a=fmtp:101 0-16', 'a=ssrc:2705443 cname:39b32d12074d4dc8', ''], ['SIP/2.0 200 OK', 'CSeq: 21343 INVITE', 'Call-ID: 7aa1d274185a463694dad4ad56aa5bf0', 'From: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525', 'To: <sip:4794001002@192.168.56.112>;tag=68947609_e95e2fe2_f42f003e_1402ffff', 'Via: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK4b7b.b8a4c295.0', 'Via: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj0d59e3092ef347b0941a21790d0dcc2f', 'Record-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525;did=82f.f488142>', 'Server: Gintel TelScale/312061d8e', 'Contact: <sip:192.168.56.111:5060>', 'Allow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS', 'Supported: replaces,100rel,timer,norefersub', 'Session-Expires: 1800;refresher=uac', 'Require: timer', 'Content-Type: application/sdp', 'Content-Length: 313', '', 'v=0', 'o=- 3926573523 3926573524 IN IP4 10.254.8.178', 's=pjmedia', 'b=AS:84', 't=0 0', 'a=X-nat:0', 'm=audio 4000 RTP/AVP 8 101', 'c=IN IP4 10.254.8.178', 'b=TIAS:64000', 'a=rtcp:4001 IN IP4 10.254.8.178', 'a=sendrecv', 'a=rtpmap:8 PCMA/8000', 'a=rtpmap:101 telephone-event/8000', 'a=fmtp:101 0-16', 'a=ssrc:2705443 cname:39b32d12074d4dc8', ''], ['ACK sip:192.168.56.111:5060 SIP/2.0', 'Record-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525>', 'Via: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK4b7b.b8a4c295.2', 'Via: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj37d31f3fcfab4805bff60cd48865f328', 'Max-Forwards: 69', 'From: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525', 'To: <sip:4794001002@192.168.56.112>;tag=68947609_e95e2fe2_f42f003e_1402ffff', 'Call-ID: 7aa1d274185a463694dad4ad56aa5bf0', 'CSeq: 21343 ACK', 'Content-Length: 0', '', ''], ['ACK sip:4794001002@192.168.56.1:60129;ob SIP/2.0', 'Call-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111', 'CSeq: 21343 ACK', 'From: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff', 'To: "4794001002" <sip:4794001002@192.168.56.112;user=phone>;tag=a1ea84fc683b4245aa9e244ca0fb73e0', 'Max-Forwards: 70', 'User-Agent: Gintel TelScale/312061d8e', 'Route: <sip:192.168.56.112;lr;ftag=21075484_e95e2fe2_f42f003e_1402ffff;did=c12.3a3df197>', 'Content-Length: 0', '', ''], ['BYE sip:192.168.56.111:5060 SIP/2.0', 'Record-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525>', 'Via: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK1b7b.df675642.0', 'Via: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj2c6e3f67cfac40fa984c3d94bcea3af0', 'Max-Forwards: 69', 'From: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525', 'To: <sip:4794001002@192.168.56.112>;tag=68947609_e95e2fe2_f42f003e_1402ffff', 'Call-ID: 7aa1d274185a463694dad4ad56aa5bf0', 'CSeq: 21344 BYE', 'User-Agent: MicroSIP/3.20.7', 'Content-Length: 0', '', ''], ['SIP/2.0 200 OK', 'CSeq: 21344 BYE', 'Call-ID: 7aa1d274185a463694dad4ad56aa5bf0', 'From: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525', 'To: <sip:4794001002@192.168.56.112>;tag=68947609_e95e2fe2_f42f003e_1402ffff', 'Via: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK1b7b.df675642.0', 'Via: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj2c6e3f67cfac40fa984c3d94bcea3af0', 'Server: Gintel TelScale/312061d8e', 'Content-Length: 0', '', ''], ['BYE sip:4794001002@192.168.56.1:60129;ob SIP/2.0', 'CSeq: 21344 BYE', 'From: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff', 'To: "4794001002" <sip:4794001002@192.168.56.112;user=phone>;tag=a1ea84fc683b4245aa9e244ca0fb73e0', 'Call-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111', 'Max-Forwards: 70', 'User-Agent: Gintel TelScale/312061d8e', 'Via: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_e8bea4d5-5cb9-4f9c-95ef-a34b8eb58402', 'Route: <sip:192.168.56.112;lr;ftag=21075484_e95e2fe2_f42f003e_1402ffff;did=c12.3a3df197>', 'Content-Length: 0', '', ''], ['SIP/2.0 200 OK', 'Via: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_e8bea4d5-5cb9-4f9c-95ef-a34b8eb58402', 'Record-Route: <sip:192.168.56.112;lr;ftag=21075484_e95e2fe2_f42f003e_1402ffff>', 'Call-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111', 'From: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff', 'To: "4794001002" <sip:4794001002@192.168.56.112;user=phone>;tag=a1ea84fc683b4245aa9e244ca0fb73e0', 'CSeq: 21344 BYE', 'Content-Length: 0', '', '']]
    filePath = "test.json"
    logInterpreter.writeJsonFileFromHeaders(startLines, headers, filePath)