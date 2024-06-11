import os, re, shutil


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
        isNotFormatedLog: bool

        for line in lines:
            if timestamp_pattern.match(line) or line.strip() == "":
                isNotFormatedLog = True
            else:
                isNotFormatedLog = False
                # print(line)

        if isNotFormatedLog:
                self.filterStandard(lines)
        else:
                self.filterNonStandard(lines)


    # To Do: Fix duplicates of only one SIP packet in entries
    def filterNonStandard(self, lines):
        timestamp_pattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}')
        reading = False #When a line is following a line with timestamp and SipLogMgr, needs to be added to the list of entries
        entries = [] #List of full Sip messages
        current_entry = [] #List of lines in current SIP-message 

        for line in lines:
            if timestamp_pattern.match(line):
                if 'SipLogMgr' in line:
                    if reading: #If program already reading logs, begin reading new log entry
                        entries.append(current_entry)
                        current_entry = []
                    reading = True
                elif reading:
                    reading = False
                    entries.append(current_entry)
                    current_entry = []
            if reading:
                current_entry.append(line)
        # print(entries)
        # return entries
    
        # for entry in entries[0]:
        #     print(entry)
        # for entry in entries[1]:
        #     print(entry)


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

        # Removes <LF><CR> from SIP headerSDP
        for line in self.headerSDP:
            line = line.replace('<LF><CR>', '\n')
            tempLines.append(line)
        self.headerSDP = tempLines
        tempLines = []


if __name__ == "__main__":
    logPath = "./logs"

    extractor = Extractor( logPath + "/" + "1.adapter.log", "output.log")

    extractor.readLog()

    print(extractor.getPreHeader())
    print(extractor.getHeaderSDP())
    print()
    print()
    print()
    print()
    for i, str in enumerate(extractor.headerSDP):
        print(i)
        print(extractor.preHeader[i])
        print(extractor.headerSDP[i])
        print()
