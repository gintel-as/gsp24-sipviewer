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
        pattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}.*?or.sip.gen.SipLogMgr.*?\n')
        timestampPattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}')
        tempLines = []

        reading = False #When a line is following a line with timestamp and SipLogMgr, needs to be added to the list of entries
        currentHeader = []
        # currentHeader = ""
        x = 0

        for line in lines:
            if timestampPattern.match(line):
                if 'or.sip.gen.SipLogMgr' in line:
                    reading = True
                    self.preHeader.append(line.strip())
                else:
                    reading = False
                    # print(currentHeader)
                    if currentHeader:   # if array not empty
                        # print(currentHeader)
                        self.headerSDP.append(currentHeader)
                    currentHeader = []

                    # if currentHeader != "":
                    #     # print(x)
                    #     # print("<<<\n" + currentHeader + ">>>\n")
                    #     self.headerSDP.append(currentHeader)
                    # currentHeader = ""

            if reading:
                if not 'or.sip.gen.SipLogMgr' in line:
                    # print(currentHeader)
                    # print(line)
                        # print(currentHeader)
                    currentHeader.append(line)

                    # print(x)
                    # print("<<<\n" + currentHeader + ">>>\n")
                    # currentHeader += line

            # print(reading, line)
            x += 1

        # To Do: Flatten array
        flattenedArray = [item for sublist in self.headerSDP for item in sublist]
        self.headerSDP = flattenedArray

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
    extractor = Extractor( logPath + "/" + "1.adapter copy.log", "output.log")
    # extractor = Extractor( logPath + "/" + "1.adapter.windows.log", "output.log")

    extractor.readLog()

    print(len(extractor.getPreHeader()))
    print(extractor.getPreHeader())
    print(len(extractor.getHeaderSDP()))
    print(extractor.getHeaderSDP())
