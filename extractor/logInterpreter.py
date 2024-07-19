from datetime import datetime
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


    def checkForInitialInvite(self, line, direction):
        toWithoutTag = r'^<sip:[A-Za-z0-9+]+@.*>(?!;tag=.*$)'
        initialInvite = False

        if line != "":
            try:
                match = re.match(toWithoutTag, line)
                if match and direction == 'from':
                    initialInvite = True
            except Exception as e:
                print(f"Error processing line: {line}, Error: {e}")
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
        pattern = r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3}) .* (\d+|NoRefNo) .* id=([A-Fa-f0-9]+) (to|from) (.*)'
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
    def createSessionInfoDict(self, sessionID, time, sipTo, sipFrom, initialInvite):
        return {
            "sessionID": sessionID,
            "time": time,
            "to": sipTo,
            "from": sipFrom,
            "participants": [],
            "associatedSessions": [],
            "initialInvite": initialInvite
        }
    
    #Initialize new empty dictionary in accordance with JSON format
    def createEmptySessionDict(self, sessionID, time, sipTo, sipFrom, initialInvite):
        return {
            "sessionInfo": self.createSessionInfoDict( sessionID, time, sipTo, sipFrom, initialInvite),
            "messages": []
        }
    

    def checkIfDictKeysContainsRelatedSessions(self, sipHeader):
        pattern = re.compile(self.relatedSessionFormatPattern)
        matchingHeaders = [key for key in sipHeader if pattern.search(key)]
        return matchingHeaders


    def filterDictOnSessionIDs(self, dict, sessionIDs):
        result = {}

        if not sessionIDs:
            return dict
        
        for sessionID in sessionIDs:
            
            if sessionID in dict:
                print("sessionID", sessionID)
                result[sessionID] = dict[sessionID]
        return result
    

    def parse_datetime(self, date_str):
        # Defines possible formats of using ms or no ms
        date_formats = ["%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S"]
        
        for date_format in date_formats:
            try:
                return datetime.strptime(date_str, date_format)
            except ValueError:
                continue
        raise ValueError(f"Date string '{date_str}' is not in a recognized format.")
    

    #Help function for filterSessionsOnTimestamp, checks if the date is between the start and end
    def is_between(self, date_str, start, end):
        # Depending on if start and end is defined, return if date fits criteria. 
        date = self.parse_datetime(date_str)
        if start and end:
             return start <= date <= end 
        if start:
            return start <= date
        if end:
            return date <= end
        return True
        

    #For each session, if sessionInfo timestamp is between start/end add to filteredSessions
    def filterSessionsOnTimestamp(self, sessionDict, startTimeStamp, endTimeStamp):
        filteredSessions = {}
        start = self.parse_datetime(startTimeStamp) if startTimeStamp else None
        end = self.parse_datetime(endTimeStamp) if endTimeStamp else None
        
        for key in sessionDict.keys():
            sessionTS = sessionDict[key]["sessionInfo"]["time"]
            if self.is_between(sessionTS, start, end):
                filteredSessions[key] = sessionDict[key]

        return filteredSessions
    

    #If sipTo or sipFrom numbers match part of the to/from number of the session, return True. Only supports phonenumbers
    def filterSessionOnToAndFrom(self, session, sipTo, sipFrom):
        phoneNumberPattern = r'<sip:(\+?\d+)(?=@)'
        match = re.search(phoneNumberPattern,  session["sessionInfo"]["to"])

        if sipTo:
            match = re.search(phoneNumberPattern,  session["sessionInfo"]["to"])
            if not match:
                return False
            if not sipTo in match.group(1):
                return False
            
        if sipFrom:
            match = re.search(phoneNumberPattern,  session["sessionInfo"]["from"])
            if not match:
                return False
            if not sipFrom in match.group(1):
                return False

        return True


    #Takes in sessionDict, returns it filtered on if sipTo and sipFrom matches to/from on each session
    def filterSessionDictOnToAndFrom(self, sessionDict, sipTo, sipFrom):
        filteredSessions = {}
        
        for sessionID in sessionDict.keys():
            session = sessionDict[sessionID]
            self.filterSessionOnToAndFrom(session, sipTo, sipFrom)
            if self.filterSessionOnToAndFrom(session, sipTo, sipFrom):
                filteredSessions[sessionID] = session

        return filteredSessions


    def createJsonFormattedSessionPacketsFromExtractedHeaders(self, startLines, headers, body):
        #SessionPackets is dict for session data, sessionIDtoAssociatedDict is a defaultDict for bidirecitonal linking of associated sessions
        sessionPackets = {}
        sessionIDtoAssociatedDict = defaultdict(set)
        #Iterate over all sessions
        for i in range(len(startLines)):
            try:
                #Fetch message details
                time, sessionID, messageID, direction, party = self.interpretStartLineString(startLines[i])
                method, sipContent = self.extractHeader(headers[i])
                message = self.createJsonFormattedMessagePacket(time, sessionID, messageID, direction, party, method, sipContent, body[i])

                if sessionID not in sessionPackets.keys():
                    initialInviteBool = self.checkForInitialInvite(sipContent['To'][0], direction)
                    sessionPackets[sessionID] = self.createEmptySessionDict(sessionID, time, sipContent["To"][0], sipContent["From"][0], initialInviteBool)
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
                    #For each related sessionID to current session, fetch all their associated sessionIDs and populate array
                    for el in relatedSessionIDs:
                        if len(sessionIDtoAssociatedDict[el]) > 0:
                          relatedSessionIDs= relatedSessionIDs + list(sessionIDtoAssociatedDict[el])
                    #Convert to set to remove duplicates, and update dictionary entry of all sessionIDs
                    relatedSessionIDs = set(relatedSessionIDs)
                    for el in relatedSessionIDs:
                        sessionIDtoAssociatedDict[el].update(relatedSessionIDs)

            except Exception as e:
                print("Packet not included due to error")
                print(e)

        for sessionID in sessionPackets.keys():
            if sessionID in sessionIDtoAssociatedDict.keys():
                sessionPackets[sessionID]["sessionInfo"]["associatedSessions"] = list(sessionIDtoAssociatedDict[sessionID])

        return sessionPackets, sessionIDtoAssociatedDict
    
    # Main method of loginterpreter
    # Takes in read data from extractor as arrays, as well as all filtering parameters
    # Outputs a written JSONfile with json.dumps
    def writeJsonFileFromHeaders(self, startLines, headers, body, filePath, sessionIDs, startTime, endTime, sipTo, sipFrom):
        #Create unfiltered dict, and then apply filters
        unfilteredSessionDict, associatedSessionsDict = self.createJsonFormattedSessionPacketsFromExtractedHeaders(startLines, headers, body)
        filteredSessionDict = self.filterDictOnSessionIDs(unfilteredSessionDict, sessionIDs)
        filteredSessionDict = self.filterSessionsOnTimestamp(filteredSessionDict,startTime , endTime)
        filteredSessionDict = self.filterSessionDictOnToAndFrom(filteredSessionDict, sipTo, sipFrom)
        filteredSessionsWithAssociatedSessions = {} # Contains all sessions that matches filters and their associated sessions

        #Get set of sessionIDs involved, and then fetch associated for all
        filteredSessionIDs = set(filteredSessionDict.keys())
        for sessionID in filteredSessionDict.keys():
            filteredSessionIDs.update(associatedSessionsDict[sessionID])

        #For each sessionID and their associated IDs, add to result
        for sessionID in filteredSessionIDs:
            if sessionID in unfilteredSessionDict.keys():
                filteredSessionsWithAssociatedSessions[sessionID] = unfilteredSessionDict[sessionID]
            else: 
                print(f'Related session {sessionID} was not found in this file.')
        print("Number of objects in the JSON file: ", len(filteredSessionsWithAssociatedSessions))            
        jsonText = json.dumps(list(filteredSessionsWithAssociatedSessions.values()), indent=2) 
        f = open(filePath, "w")
        f.write(jsonText)
        f.close()
    

if __name__ == "__main__":
    logInterpreter = LogInterpreter()
    filePath = "./json/test.json"
    
    # Remember to add to the arrays for testing
    startLines = []
    headers = []
    body = []

    # sessionIDs = ['104820521', '104820522']
    sessionIDs = []

    # "2024-07-03 09:54:00.903"
    startTime = "2024-07-03 09:06:16.664"
    endTime = "2024-07-03 09:06:16.666"
    
    
    logInterpreter.writeJsonFileFromHeaders(startLines, headers, body, filePath, sessionIDs, startTime, endTime)