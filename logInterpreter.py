import json
import re

class LogInterpreter:
    
    def createPreHeaderDict(self, time, sessionID, messageID, direction, party, messageType):
        preHeaderDict = {
            "time": time,
            "sessionID": sessionID,
            "messageID": messageID,
            "direction": direction,
            "party": party,
            "messageType": messageType
        }
        return preHeaderDict
    
    def createSipHeaderDict(self, messageType, sip_to, sip_from, content):
        sipHeaderDict = {
            "messageType": messageType,
            "to": sip_to,
            "from": sip_from,
            "content": content
        }
        return sipHeaderDict
    
    def createSdpDict(self, content):
        sdpDict = {
            "content": content
        }
        return sdpDict

    def createPacketDict(self, preHeaderDict, sipHeaderDict, sdpDict):
        packetDict = {
            "preHeader": preHeaderDict,
            "sipHeader": sipHeaderDict,
            "sdp": sdpDict 
        }
        return packetDict
    
    def interpretPreHeaderString(self, preHeaderString):
        pattern = r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3}) .* (\d{9}) .* id=([A-Fa-f0-9]{8}) (to|from) (\w+)'
        match = re.match(pattern, preHeaderString)
        timestamp = match.group(1)
        sessionId = match.group(2)
        messageId = match.group(3)
        direction = match.group(4)
        party = match.group(5)
        return timestamp, sessionId, messageId, direction, party

    def createJsonPacket(self, time, sessionID, messageID, direction, party, messageType, sip_to, sip_from, sip_content, sdp):
        preHeaderDict = self.createPreHeaderDict(time, sessionID, messageID, direction, party, messageType)
        sipHeaderDict = self.createSipHeaderDict(messageType, sip_to, sip_from, sip_content)
        sdpDict = self.createSdpDict(sdp)
        packetDict = self.createPacketDict(preHeaderDict, sipHeaderDict, sdpDict)
        return json.dumps(packetDict, indent=4) #ToDo: muligens fjern indent
    
    
if __name__ == "__main__":  
    logInterpreter = LogInterpreter()
    preHeaders = ['2024-06-05 10:52:02.446 DEBUG [or.sip.gen.SipLogMgr][Thread-7] 104328762 Received message with id=E5D71B08 from LegA', '2024-06-05 10:52:02.525 DEBUG [or.sip.gen.SipLogMgr][Thread-7] 104328762 Sending message with id=E5D71B09 to LegB', '2024-06-05 10:52:02.699 DEBUG [or.sip.gen.SipLogMgr][Thread-8] 104328762 Received message with id=E5D71B0A from LegB', '2024-06-05 10:52:02.748 DEBUG [or.sip.gen.SipLogMgr][Thread-9] 104328762 Received message with id=E5D71B0B from LegB', '2024-06-05 10:52:02.772 DEBUG [or.sip.gen.SipLogMgr][Thread-9] 104328762 Sending message with id=E5D71B0C to LegA', '2024-06-05 10:52:06.078 DEBUG [or.sip.gen.SipLogMgr][hread-12] 104328762 Received message with id=E5D71B0D from LegB', '2024-06-05 10:52:06.130 DEBUG [or.sip.gen.SipLogMgr][hread-12] 104328762 Sending message with id=E5D71B0E to LegA', '2024-06-05 10:52:06.180 DEBUG [or.sip.gen.SipLogMgr][hread-13] 104328762 Received message with id=E5D71B0F from LegA', '2024-06-05 10:52:06.197 DEBUG [or.sip.gen.SipLogMgr][hread-13] 104328762 Sending message with id=E5D71B10 to LegB', '2024-06-05 10:52:12.990 DEBUG [or.sip.gen.SipLogMgr][hread-14] 104328762 Received message with id=E5D71B11 from LegA', '2024-06-05 10:52:12.997 DEBUG [or.sip.gen.SipLogMgr][hread-14] 104328762 Sending message with id=E5D71B12 to LegA', '2024-06-05 10:52:13.018 DEBUG [or.sip.gen.SipLogMgr][hread-14] 104328762 Sending message with id=E5D71B13 to LegB', '2024-06-05 10:52:13.072 DEBUG [or.sip.gen.SipLogMgr][hread-15] 104328762 Received message with id=E5D71B14 from LegB']
    #Test data:
    time = '2024-06-05 10:52:02.446'
    sessionID = '104328762' 
    messageID = 'E5D71B08'
    direction = 'from' 
    party = 'Helle'
    messageType = "INVITE XXXXX"
    sip_to = "Alexander"
    sip_from = "Helle"
    sip_content = ["Hei", "på", "deg"]
    sdp = ["Ja", "vi", "elsker"]

    json_pct = logInterpreter.createJsonPacket(time, sessionID, messageID, direction, party, messageType, sip_to, sip_from, sip_content, sdp)
    print(json_pct)