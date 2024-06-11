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
        isFormated = True

        for line in lines:
            # print(line)
            if timestamp_pattern.match(line) or line.strip() == "":
                continue
            else:
                isFormated = False

        if isFormated:
            # print(isFormated)
            self.filterStandard(lines)
        else:
            # print(isFormated)
            self.filterNonStandard(lines)


    # To Do: Fix duplicates of only one SIP packet in entries
    def filterNonStandard(self, lines):
        pattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}.*?message with id=.*?\n')

        for line in lines:
            match = pattern.search(line)
            if match:
                self.preHeader.append(match.group(0).strip())
                # remaining_content = line[match.end():].strip()
                self.headerSDP.append(line[match.end():].strip())

        # timestamp_pattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}')
        # reading = False #When a line is following a line with timestamp and SipLogMgr, needs to be added to the list of entries
        # entries = [] #List of full Sip messages
        # current_entry = [] #List of lines in current SIP-message 

        # for line in lines:
        #     if timestamp_pattern.match(line):
        #         if 'SipLogMgr' in line:
        #             # print(line)
        #             if reading: #If program already reading logs, begin reading new log entry
        #                 entries.append(current_entry)
        #                 current_entry = []
        #             reading = True
        #         elif reading:
        #             reading = False
        #             entries.append(current_entry)
        #             current_entry = []
        #     if reading:
        #         current_entry.append(line)
        # print(entries)
        # return entries
    
        # for i, str in enumerate(entries):
        #     print(entries[i])

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
            # print(parts)
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

    # extractor = Extractor( logPath + "/" + "1.adapter.log", "output.log")
    extractor = Extractor( logPath + "/" + "1.adapter.windows.log", "output.log")

    extractor.readLog()

    print(len(extractor.getPreHeader()))
    print(extractor.getPreHeader())
    print(len(extractor.getHeaderSDP()))
    print(extractor.getHeaderSDP())
    # print()
    # print()
    # print()
    # print()
    # for i, str in enumerate(extractor.headerSDP):
    #     print(i)
    #     print(extractor.preHeader[i])
    #     print(extractor.headerSDP[i])
    #     print()
