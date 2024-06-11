import os, re, shutil


class Extractor:
    def __init__(self, inputFile, outputLog) -> None:
        self.inputFile = inputFile
        self.outputLog = outputLog
        self.temp = 'temp.log'
        self.temp1 = 'temp1.log'

    # def readLog(self):      # Read the log and filter out SIP packets
    #     with open(self.inputFile, 'r') as input, open(self.temp, 'w') as output:
    #         for line in input:
    #             if 'SipLogMgr' in line:
    #                 output.writelines(line)

    def format(self):
        replacements = ["<LF><CR>", '<CR>', '\n']
        # with open(self.temp, 'r') as inputFile:
        #     for line in inputFile:
        #         # currentID = line.split()[4]
        #         # if currentID not in self.logIDArr:
        #         #     self.logIDArr.append(currentID)
        #         for item in replacements:
        #             content = content.replace(item, '\n')   # legg til erstatning
        with open(self.temp, 'r') as inputFile:
            content = inputFile.read()
            for item in replacements:
                content = content.replace(item, '\n')
        with open(self.temp1, 'w') as outputFile:
            outputFile.write(content)
    
    def read_sip(self):
        with open(self.inputFile, 'r') as file:
            lines = file.readlines()
        
        timestamp_pattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}')
        
        reading = False
        entries = []
        current_entry = []

        for line in lines:
            if timestamp_pattern.match(line):
                if 'SipLogMgr' in line: #ToDo, fix for to følgende siplogmgr
                    if reading:
                        entries.append(current_entry)
                        current_entry = []
                    reading = True
                elif reading:
                    reading = False
                    entries.append(current_entry)
                    current_entry = []
            if reading:
                current_entry.append(line)
        return entries



if __name__ == "__main__":
    logPath = "./logs"

    extractor = Extractor( logPath + "/" + "1.adapter.windows.log", "output.log")

    entries = extractor.read_sip()
    print(entries)
    print('----------------')
    print(entries[0])
    print('----------------')   
    for entry in entries[0]:
        print(entry)
    for entry in entries[1]:
        print(entry)
