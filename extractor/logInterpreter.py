import json, re
from collections import defaultdict

class LogInterpreter:


    def __init__(self):
        self.relatedSessionFormatPattern = r'X-Gt(?:-[A-Za-z0-9]+)?-SessionId'

    
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


    def checkForInitialInvite(self, sipHeader, direction, party):
        sipContent = defaultdict(list)
        # toWithTag = r'^To:\s*<sip:[A-Za-z0-9+]+@.*>;tag=.*$'
        toWithoutTag = r'^To:\s*<sip:[A-Za-z0-9+]+@.*>(?!;tag=.*$)'
        initialInvite = False
        sipContent["Header"].append(sipHeader[0])

        for i in range(1,len(sipHeader)):
            x = sipHeader[i]
            if x != "":
                try:
                    match = re.match(toWithoutTag, x)
                    if match and direction == 'from':
                        initialInvite = True
                    print(x)
                    print(initialInvite)
                except Exception as e:
                    print(f"Error processing line: {x}, Error: {e}")
        return initialInvite

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
    

    def createJsonFormattedMessagePacket(self, time, sessionID, messageID, direction, party, method, sipContent, body):
        startLineDict = self.createStartLineDict(time, sessionID, messageID, direction, party, method)
        sipHeaderDict = dict(sipContent)
        bodyDict = self.createBodyDict(body)
        packetDict = self.createPacketDict(startLineDict, sipHeaderDict, bodyDict)
        return packetDict

    
    # Can modify the sessionInfoDict to add bool for initial INVITE
    def createSessionInfoDict(self, sessionID, time, sipTo, sipFrom):
        return {
            "sessionID": sessionID,
            "time": time,
            "to": sipTo,
            "from": sipFrom,
            "participants": [],
            "associatedSessions": [],
            # "initialInvite": bool
        }
    
    
    def createEmptySessionDict(self, sessionID, time, sipTo, sipFrom):
        return {
            "sessionInfo": self.createSessionInfoDict( sessionID, time, sipTo, sipFrom),
            "messages": []
        }
    
    def checkIfDictKeysContainsRelatedSessions(self, sipHeader):
        pattern = re.compile(self.relatedSessionFormatPattern)
        matchingHeaders = [key for key in sipHeader if pattern.search(key)]
        return matchingHeaders
    

    def createJsonFormattedSessionPacketsFromExtractedHeaders(self, startLines, headers, body):
        sessionPackets = {}
        #Iterate over all sessions
        for i in range(len(startLines)):
            try:
                #Fetch message details
                time, sessionID, messageID, direction, party = self.interpretStartLineString(startLines[i])
                
                

                method, sipContent = self.extractHeader(headers[i])
                initialInviteBool = self.checkForInitialInvite(headers[i], direction, party)
                # if initialInviteBool:
                #     print('packet: ', i, initialInviteBool)

                message = self.createJsonFormattedMessagePacket(time, sessionID, messageID, direction, party, method, sipContent, body[i])
                
                if sessionID not in sessionPackets.keys():
                    sessionPackets[sessionID] = self.createEmptySessionDict(sessionID, time, sipContent["To"][0], sipContent["From"][0])
                associatedSessionIDKeys = self.checkIfDictKeysContainsRelatedSessions(sipContent)
                #Add to SessionInfo if attribtes exsist in message
                currentSession = sessionPackets[sessionID]
                currentSession['messages'].append(message)
                currentSessionInfo = currentSession['sessionInfo']
                if sipContent['To']:
                    for el in sipContent['To']:
                        if el not in currentSessionInfo['participants']:
                             currentSessionInfo['participants'].append(el)
                if sipContent['From']:
                    for el in sipContent['From']:
                        if el not in currentSessionInfo['participants']:
                             currentSessionInfo['participants'].append(el)
                for associatedSessionKey in associatedSessionIDKeys:
                    relatedSessionIDs = sipContent[associatedSessionKey][0].replace(' ', '').split(',')
                    for el in relatedSessionIDs:
                        if el not in currentSessionInfo['associatedSessions']:
                            currentSessionInfo['associatedSessions'].append(el)

            except Exception as e:
                print("Packet not included due to error")
                print(e)

        return json.dumps(list(sessionPackets.values()), indent=2)
    
    
    def writeJsonFileFromHeaders(self, startLines, headers, body, filePath):
        f = open(filePath, "w")
        jsonText = self.createJsonFormattedSessionPacketsFromExtractedHeaders(startLines, headers, body)
        f.write(jsonText)
        f.close()


if __name__ == "__main__":  
    logInterpreter = LogInterpreter()
    filePath = "./json/test.json"
    
    # Remember to add to the arrays for testing
    startLines = ['2023-07-06 13:22:51.233 DEBUG [or.sip.gen.SipLogMgr][Thread-0] 304286493 Received message with id=972EEFE9 from LegA', '2023-07-06 13:22:51.266 DEBUG [or.sip.gen.SipLogMgr][Thread-0] 304286493 Sending message with id=972EEFEA to LegB', '2023-07-06 13:22:51.268 DEBUG [or.sip.gen.SipLogMgr][Thread-2] 304286493 Received message with id=972EEFEB from LegB', '2023-07-06 13:22:51.270 DEBUG [or.sip.gen.SipLogMgr][Thread-2] 304286493 Sending message with id=972EEFEC to LegA']
    headers = [['INVITE sip:+420100000004@10.0.2.12:5060 SIP/2.0', 'Record-Route: <sip:10.254.32.47:5065;lr>', 'Via: SIP/2.0/UDP 10.254.32.47:5065;branch=z9hG4bK3548.40a528b4.0', 'Via: SIP/2.0/UDP 10.254.32.47:7001;branch=z9hG4bK-24876-1-0', 'From: <sip:+420100000001@10.254.32.47:7001>;tag=24876SIPpTag001', 'To: <sip:+420100000004@10.254.32.47:5065>', 'Call-ID: 1-24876@10.254.32.47', 'CSeq: 1 INVITE', 'Contact: <sip:+420100000001@10.254.32.47:7001>', 'Max-Forwards: 69', 'Content-Type: application/sdp', 'Subject: A1 INVITE', 'P-Visited-Network-ID: test', 'P-Com.Nokia.B2BUA-Involved: test', 'P-NokiaSiemens.Session-Info: test', 'P-NokiaSiemens.OriginatingServiceData: test', 'P-com.Siemens.Access-Information: test', 'P-NokiaSiemens.Default-IMPU: test', 'P-com.Siemens.Corr-ID: test', 'X-Rimssf-ServiceKey: 313', 'P-hint: Second', 'Content-Length: 337'], ['INVITE sip:+420100000004@10.254.32.47:5065;user=phone SIP/2.0', 'From: <sip:+420100000001@10.254.32.47:7001;user=phone>;tag=66168705_a73972a8_f42f003e_a1e6602f', 'To: <sip:+420100000004@10.254.32.47:5065;user=phone>', 'CSeq: 1 INVITE', 'Subject: A1 INVITE', 'P-hint: Second', 'Call-ID: 79e120310ea99cd6da52994104cfb73a@10.0.2.12', 'Route: <sip:10.254.32.47:5065;lr>', 'Via: SIP/2.0/UDP 10.0.2.12:5060;branch=z9hG4bKa1e6602f_f42f003e_dd6638e6-ce33-4e6a-96c4-3afa5052dabd', 'Contact: <sip:+420100000001@10.0.2.12:5060>', 'Privacy: none', 'Max-Forwards: 68', 'X-Gt-Served-User: <sip:+420100000004@10.0.2.12:5060;sno=CentrexInbound;cid=1299;type=TerminateNumber>', 'X-Gt-SessionId: 304286493', 'Content-Type: application/sdp', 'Session-Expires: 1750', 'Min-SE: 90', 'Supported: timer', 'Content-Length: 337'], ['SIP/2.0 180 Ringing', 'Via: SIP/2.0/UDP 10.0.2.12:5060;branch=z9hG4bKa1e6602f_f42f003e_dd6638e6-ce33-4e6a-96c4-3afa5052dabd', 'From: <sip:+420100000001@10.254.32.47:7001;user=phone>;tag=66168705_a73972a8_f42f003e_a1e6602f', 'To: <sip:+420100000004@10.254.32.47:5065;user=phone>;tag=24874SIPpTag011', 'Call-ID: 79e120310ea99cd6da52994104cfb73a@10.0.2.12', 'CSeq: 1 INVITE', 'Contact: <sip:10.254.32.47:7004;transport=UDP>', 'Subject: B1 180 Ringing', 'Record-Route: <sip:10.254.32.47:5065;lr>', 'Content-Length: 0'], ['SIP/2.0 180 Ringing', 'CSeq: 1 INVITE', 'Call-ID: 1-24876@10.254.32.47', 'From: <sip:+420100000001@10.254.32.47:7001>;tag=24876SIPpTag001', 'To: <sip:+420100000004@10.254.32.47:5065>;tag=71282263_a73972a8_f42f003e_a1e6602f', 'Via: SIP/2.0/UDP 10.254.32.47:5065;branch=z9hG4bK3548.40a528b4.0', 'Via: SIP/2.0/UDP 10.254.32.47:7001;branch=z9hG4bK-24876-1-0', 'Record-Route: <sip:10.254.32.47:5065;lr>', 'Server: Gintel TelScale/2a4a12bbc', 'Contact: <sip:10.0.2.12:5060>', 'Subject: B1 180 Ringing', 'X-Gt-Served-User: <sip:+420100000004@10.0.2.12:5060;cid=-1;type=undefined>', 'Content-Length: 0']]
    body = [['v=0', 'o=- 3897020923 3897020923 IN IP4 10.254.8.12', 's=pjmedia', 'b=AS:84', 't=0 0', 'a=X-nat:0', 'm=audio 4004 RTP/AVP 8 0 101', 'c=IN IP4 10.254.8.12', 'b=TIAS:64000', 'a=rtcp:4005 IN IP4 10.254.8.12', 'a=sendrecv', 'a=rtpmap:8 PCMA/8000', 'a=rtpmap:0 PCMU/8000', 'a=rtpmap:101 telephone-event/8000', 'a=fmtp:101 0-16', 'a=ssrc:1650027937 cname:149b66c930317110'], ['v=0', 'o=- 3897020923 3897020923 IN IP4 10.254.8.12', 's=pjmedia', 'b=AS:84', 't=0 0', 'a=X-nat:0', 'm=audio 4004 RTP/AVP 8 0 101', 'c=IN IP4 10.254.8.12', 'b=TIAS:64000', 'a=rtcp:4005 IN IP4 10.254.8.12', 'a=sendrecv', 'a=rtpmap:8 PCMA/8000', 'a=rtpmap:0 PCMU/8000', 'a=rtpmap:101 telephone-event/8000', 'a=fmtp:101 0-16', 'a=ssrc:1650027937 cname:149b66c930317110'], [], []]
    logInterpreter.writeJsonFileFromHeaders(startLines, headers, body, filePath)