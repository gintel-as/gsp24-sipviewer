import os, re, shutil
import json

class Extractor:
    def __init__(self, inputFile, outputLog) -> None:
        self.inputFile = inputFile
        self.outputLog = outputLog
        self.preHeader = []
        self.headerSDP = []
    

    def getPreHeader(self):
        return self.preHeader


    def getHeaderSDP(self):
        return self.headerSDP


    def readLog(self):
        with open(self.inputFile, 'r') as file:
            lines = file.readlines()

        timestamp_pattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}')    
        isFormated = True

        for line in lines:
            if timestamp_pattern.match(line) or line.strip() == "":
                continue
            else:
                isFormated = False

        if isFormated:
            self.filterStandard(lines)
        else:
            self.filterNonStandard(lines)


    def filterNonStandard(self, lines):
        # pattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}.*?or.sip.gen.SipLogMgr.*?\n')
        timestampPattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}')

        reading = False # When a line is following a line with timestamp and SipLogMgr, needs to be added to the list of entries
        currentEntry = []

        for line in lines:
            if timestampPattern.match(line):
                if 'or.sip.gen.SipLogMgr' in line:  # Find preHeader for SIP packet
                    reading = True
                    self.preHeader.append(line.strip())
                else:  
                    reading = False

                    if currentEntry:   # if array not empty
                        self.headerSDP.append(currentEntry)
                    currentEntry = []

            if reading and not 'or.sip.gen.SipLogMgr' in line:
                    currentEntry.append(line.strip())   # appends to headerSDP in next loop if there are entries


    def filterStandard(self, lines):
        tempLines = []

        # Filter for or.sip.gen.SipLogMgr
        for line in lines:
            if 'or.sip.gen.SipLogMgr' in line:
                tempLines.append(line)
        lines = tempLines
        tempLines = []

        # Separates preHeader from rest of SIP packet
        for line in lines:
            parts = line.split('<CR>', 1)
            self.preHeader.append(parts[0])
            self.headerSDP.append(parts[1])

        # Removes <LF><CR> from SIP packet
        for line in self.headerSDP:
            line = line.strip().split('<LF><CR>')
            tempLines.append(line)

        self.headerSDP = tempLines


if __name__ == "__main__":
    logPath = "./logs"

    extractor = Extractor( logPath + "/" + "1.adapter.log", "output.log")
    # extractor = Extractor( logPath + "/" + "1.adapter copy.log", "output.log")
    # extractor = Extractor( logPath + "/" + "1.adapter.windows.log", "output.log")

    extractor.readLog()

    print(len(extractor.getPreHeader()))
    print(extractor.getPreHeader())
    print(len(extractor.getHeaderSDP()))
    print(extractor.getHeaderSDP())
