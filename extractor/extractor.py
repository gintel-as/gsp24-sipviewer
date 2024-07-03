import os, re, shutil
import json

class LogExtractor:
    def __init__(self, inputFile) -> None:
        self.inputFile = inputFile
        self.startLine = []
        self.header = []
        self.body = []
    

    def getStartLine(self):
        return self.startLine


    def getHeader(self):
        return self.header
    

    def getBody(self):
        return self.body

    def formatLogs(self):
        # self.startLine = [string for string in self.startLine if string]
        # self.header = [string for string in self.header if string]
        # self.body = [string for string in self.body if string]
        # self.startLine = [[item for item in sub_array if item != ''] for sub_array in self.startLine]
        # self.header = [[item for item in sub_array if item != ''] for sub_array in self.header]
        self.body = [[item for item in sub_array if item != ''] for sub_array in self.body]
        print()
        # Add code that removes any instance of <LF> and <CR>

    def readLog(self):
        with open(self.inputFile, 'r') as file:
            lines = file.readlines()

        timestampPattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+')
        isFormatted = True

        for line in lines:
            if timestampPattern.match(line) or line.strip() == "":
                continue
            else:
                isFormatted = False

        if isFormatted:
            self.filterStandard(lines)
        else:
            self.filterNonStandard(lines)
        
        self.formatLogs()

    def filterNonStandard(self, lines):
        timestampPattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+')
        startLine = False
        content = False
        body = False
        currentHeader = []
        currentBody = []

        for line in lines:
            if timestampPattern.match(line):    # If line is startline
                currentHeader = []
                currentBody = []
                # stores to global variables
                self.header.append(currentHeader)
                self.body.append(currentBody)

                startLine = True
                content = False
                body = False
            else:                               # If line is content (header and body)
                startLine = False
                content = True

                if line == '\n':                # checks if line is body
                    body = True
            
            # append lines to temp arrays
            if startLine:
                # currentStartLine.append(line.strip())
                self.startLine.append(line.strip())                

            if content:
                if body:    
                    currentBody.append(line.strip())
                else:
                    currentHeader.append(line.strip())


    def filterStandard(self, lines):
        tempLines = []
        headerBodyTemp = []
        headerTemp = []
        bodyTemp = []
        
        # Filter for or.sip.gen.SipLogMgr
        for line in lines:
            if 'or.sip.gen.SipLogMgr' in line:
                tempLines.append(line)
        lines = tempLines
        # tempLines = []

        # Separates startLine from rest of SIP packet
        for line in lines:
            parts = line.split('<CR>', 1)
            self.startLine.append(parts[0])
            
            headerBodyTemp.append(parts[1])

        # Divides headerBody into separate arrays
        for line in headerBodyTemp:
            parts = line.split('<LF><CR><LF><CR>', 1)
            self.header.append(parts[0])
            self.body.append(parts[1])

        # Removes <LF><CR> from header
        for line in self.header:
            line = line.strip().split('<LF><CR>')
            headerTemp.append(line)
            
        self.header = headerTemp

        # Removes <LF><CR> from body
        for line in self.body:
            line = line.strip().split('<LF><CR>')
            bodyTemp.append(line)

        self.body = bodyTemp



if __name__ == "__main__":
    logPath = "./logs"

    # logExtractor = LogExtractor( logPath + "/" + "standard.log")
    # logExtractor = LogExtractor( logPath + "/" + "1.adapter.log")
    # logExtractor = LogExtractor( logPath + "/" + "1.adapter copy.log")
    # logExtractor = LogExtractor( logPath + "/" + "1.adapter.windows.log")

    # logExtractor.readLog()

    # x = 1
    # print(len(logExtractor.getStartLine()))
    # print(logExtractor.getStartLine()[x])
    # print()
    # print(len(logExtractor.getHeader()))
    # print(logExtractor.getHeader()[x])
    # print()
    # print(len(logExtractor.getBody()))
    # print(logExtractor.getBody()[x])


    logExtractor = LogExtractor( logPath + "/" + "standard.log")
    logExtractor.readLog()
    start1 = logExtractor.getStartLine()
    header1 = logExtractor.getHeader()
    body1 = logExtractor.getBody()

    logExtractor = LogExtractor( logPath + "/" + "non-standard.log")
    logExtractor.readLog()
    start2 = logExtractor.getStartLine()
    header2 = logExtractor.getHeader()
    body2 = logExtractor.getBody()

    if start1 == start2:
        print(True, 'start')
    else:
        print(False, 'start')

    if header1 == header2:
        print(True, 'header')
    else:
        print(False, 'header')

    if body1 == body2:
        print(True, 'body')
    else:
        print(False, 'body')
