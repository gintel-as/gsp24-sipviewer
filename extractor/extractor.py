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


    def cleanLogs(self, element):
        cleaned_element = element.replace('<LF>', '').replace('<CR>', '')
        return cleaned_element if cleaned_element else None


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
        
        # removes all instances of <LF> and <CR> in arrays
        self.header = [
            [self.cleanLogs(item) for item in sub_array if self.cleanLogs(item) is not None]
            for sub_array in self.header
        ]
        self.body = [
            [self.cleanLogs(item) for item in sub_array if self.cleanLogs(item) is not None]
            for sub_array in self.body
        ]

    # non-standard logs does not have a timestamp on every line
    def filterNonStandard(self, lines):
        timestampPattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+')
        sipLogMgrPattern = re.compile(r'.*or.sip.gen.SipLogMgr.*')
        startLine = False
        content = False
        body = False
        currentHeader = []
        currentBody = []

        for line in lines:
            readLine = True
            if timestampPattern.match(line):    # If line is startline
                currentHeader = []
                currentBody = []
                if sipLogMgrPattern.search(line):
                    self.header.append(currentHeader)
                    self.body.append(currentBody)
                else: #If matching timestamp but no sipLogMgr, skip line
                    readLine = False
                startLine = True
                content = False
                body = False
                
            else:                               # If line is content (header and body)
                startLine = False
                content = True

                if line == '\n':                # checks if line is body
                    body = True
            
            if readLine:
                if startLine:
                    self.startLine.append(line.strip())                

                if content:
                    if body:    
                        currentBody.append(line.strip())
                    else:
                        currentHeader.append(line.strip())


    # stadard logs have a timestamp on every line
    def filterStandard(self, lines):
        tempLines = []
        headerBodyTemp = []
        headerTemp = []
        bodyTemp = []

        timestampSipLogPattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+ DEBUG \[or.sip.gen.SipLogMgr\]')
        
        # Filter for or.sip.gen.SipLogMgr
        for line in lines:
            if timestampSipLogPattern.match(line):
                tempLines.append(line)
        lines = tempLines

        # Separates startLine from rest of SIP packet
        for line in lines:
            parts = line.split('<CR>', 1)
            self.startLine.append(parts[0])
            
            headerBodyTemp.append(parts[1])

        # Divides headerBody into separate arrays
        for line in headerBodyTemp:
            parts = line.split('<LF><CR><LF><CR>', 1)
            try:
                self.header.append(parts[0])
                self.body.append(parts[1])
            except:
                self.header.append(parts[0])
                self.body.append('')

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

    logExtractor = LogExtractor( logPath + "/" + "standard.log")
    logExtractor.readLog()

    startLine = logExtractor.getStartLine()
    header = logExtractor.getHeader()
    body = logExtractor.getBody()

    print(startLine)
    print()
    print(header)
    print()
    print(body)
