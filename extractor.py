import os, re, shutil


class Extractor:
    def __init__(self, inputFile, outputLog) -> None:
        self.inputFile = inputFile
        self.outputLog = outputLog
        self.temp = 'temp.log'
        self.temp1 = 'temp1.log'

    def readLog(self):      # Read the log and filter out SIP packets
        with open(self.inputFile, 'r') as input, open(self.temp, 'w') as output:
            for line in input:
                if 'SipLogMgr' in line:
                    output.writelines(line)

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




    def read_sip_log(self):
        with open(self.inputFile, 'r') as file:
            lines = file.readlines()

        timestamp_pattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}')
        current_entry = []
        entries = []

        for line in lines:
            if 'SipLogMgr' in line:
                if timestamp_pattern.match(line):
                    if current_entry:
                        entries.append(' '.join(current_entry).strip())
                    current_entry = [line.strip()]
                else:
                    current_entry.append(line.strip())
        
        if current_entry:
            entries.append(' '.join(current_entry).strip())

        return entries






if __name__ == "__main__":
    logPath = "./logs"

    extractor = Extractor( logPath + "/" + "1.adapter.windows.log", "output.log")
    # extractor.readLog()
    # extractor.format()

    entries = extractor.read_sip_log()
    for entry in entries:
        print(entry)


    





#     def readLog(self):      # Read the log and filter out SIP packets
#         with open(self.logFile, 'r') as inputFile, open(self.temp, 'w') as outputFile:
#             for line in inputFile:
#                 if 'message with id' in line:
#                     outputFile.writelines(line)


#     def identifyUserAgents(self, currentID):    # Identifies user agent of the specific message
#         with open(self.temp, 'r') as inputFile:
#             for line in inputFile:
#                 currentUserAgent = line.split()[10]
#                 if currentID in line and currentUserAgent in line:
#                     legX = ''.join(re.split(r"\<.*$", currentUserAgent)[ : -1])     # Isolates "LegX" from the specific message in the log
#                     if legX not in self.UserAgentArr:
#                         self.UserAgentArr.append(legX)


#     def splitTraceAndFormat(self):      # Identifies traces in the log
#         with open(self.temp, 'r') as inputFile:
#             for line in inputFile:
#                 currentID = line.split()[4]
#                 if currentID not in self.logIDArr:
#                     self.logIDArr.append(currentID)

#         for ID in self.logIDArr:
#             self.UserAgentArr.clear()
#             path = self.logDirPath + ID
#             isExist = os.path.exists(path)
#             file = self.logDirPath + ID + '.log'
#             replacements = ["<LF><CR>", '<CR>']
#             if not isExist:
#                 os.makedirs(path)
            
#             with open(self.temp, "r") as inputFile, open(file, 'w') as outputFile:      # Separates the traces into individual logs
#                 for line in inputFile:
#                     if line.split()[4] == ID:
#                         outputFile.writelines(line)
#                 self.identifyUserAgents(ID)

#             for UA in self.UserAgentArr:    # Formats packets by User Agents
#                 legFile = self.logDirPath + ID + "_" + UA + '.log'
#                 logTrace = self.logDirPath + ID + '.log'
#                 with open(logTrace, "r") as inputFile, open(legFile, 'w') as outputFile:
#                     for line in inputFile:
#                         if UA in line:
#                             outputFile.writelines(line)
#                 with open(legFile, 'r') as inputFile:
#                     content = inputFile.read()
#                     for item in replacements:
#                         content = content.replace(item, '\n' + '\t')
#                 with open(legFile, 'w') as outputFile:
#                     outputFile.write(content)
#                 shutil.move(legFile, self.logDirPath + ID + '/' + ID + "_" + UA + '.log')

#             with open(file, 'r') as inputFile:  # Formats the packets by trace
#                 content = inputFile.read()
#                 currentID = line.split()[4]
#                 for item in replacements:
#                     if currentID in line:
#                         content = content.replace(item, '\n' + '\t')
#             with open(file, 'w') as inputFile:
#                 inputFile.write(content)
#             shutil.move(file, self.logDirPath + ID + '/' + ID + '.log')
#         os.remove(self.temp)


#     def getLogIDarr(self):
#         return self.logIDArr


# if __name__ == "__main__":
#     readAndFilterLog = logFilter('../logFiles/adapter.log')
#     readAndFilterLog.readLog()
#     readAndFilterLog.splitTraceAndFormat()
