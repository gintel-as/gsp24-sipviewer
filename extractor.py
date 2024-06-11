import os, re, shutil
import json


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
        return entries
    
    
    # JSON crap: 
    
    def split_header_array(self, index): # Retrieve header with index "index" from header array
        #readLine greier for å ta inn header liste??
        header = ['INVITE sip:4794001002@192.168.56.111;user=phone SIP/2.0\nRecord-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525;did=82f.f488142>\nVia: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK4b7b.b8a4c295.0\nVia: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj0d59e3092ef347b0941a21790d0dcc2f\nMax-Forwards: 69\nFrom: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525\nTo: <sip:4794001002@192.168.56.112>\nContact: "44779790101-VM" <sip:44779790101@192.168.56.1:64489;ob>\nCall-ID: 7aa1d274185a463694dad4ad56aa5bf0\nCSeq: 21343 INVITE\nAllow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS\nSupported: replaces,100rel,timer,norefersub\nSession-Expires: 1800\nMin-SE: 90\nUser-Agent: MicroSIP/3.20.7\nContent-Type: application/sdp\nRemote-Party-ID: "44779790101" <sip:44779790101@0.0.0.0>;party=calling;id-type=subscriber;privacy=off;screen=no\nContent-Length: 340\n\nv=0\no=- 3926573523 3926573523 IN IP4 10.254.8.178\ns=pjmedia\nb=AS:84\nt=0 0\na=X-nat:0\nm=audio 4002 RTP/AVP 8 0 101\nc=IN IP4 10.254.8.178\nb=TIAS:64000\na=rtcp:4003 IN IP4 10.254.8.178\na=sendrecv\na=rtpmap:8 PCMA/8000\na=rtpmap:0 PCMU/8000\na=rtpmap:101 telephone-event/8000\na=fmtp:101 0-16\na=ssrc:1932486814 cname:1af30a2f01e36ab9\n\n', 'INVITE sip:4794001002@192.168.56.112:5060;user=phone SIP/2.0\nFrom: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff\nTo: "4794001002" <sip:4794001002@192.168.56.112;user=phone>\nCSeq: 21343 INVITE\nAllow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS\nUser-Agent: MicroSIP/3.20.7\nRemote-Party-ID: "44779790101" <sip:44779790101@0.0.0.0>;party=calling;id-type=subscriber;privacy=off;screen=no\nCall-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111\nRoute: <sip:192.168.56.112:5060;lr>\nVia: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_21505e85-9471-4e8c-9fea-e3dfd9c2676e\nContact: <sip:44779790101@192.168.56.111:5060;ob>\nMax-Forwards: 68\nX-Gt-MBN-Served-User: <sip:+4794001002@192.168.56.111:5060;sno=MBNInbound;cid=153;type=HuntConnect;desttype=EndUser;anumindicator=0>\nX-Gt-MBN-SessionId: 104328762\nContent-Type: application/sdp\nSession-Expires: 90\nMin-SE: 90\nSupported: replaces,100rel,timer,norefersub\nContent-Length: 340\n\nv=0\no=- 3926573523 3926573523 IN IP4 10.254.8.178\ns=pjmedia\nb=AS:84\nt=0 0\na=X-nat:0\nm=audio 4002 RTP/AVP 8 0 101\nc=IN IP4 10.254.8.178\nb=TIAS:64000\na=rtcp:4003 IN IP4 10.254.8.178\na=sendrecv\na=rtpmap:8 PCMA/8000\na=rtpmap:0 PCMU/8000\na=rtpmap:101 telephone-event/8000\na=fmtp:101 0-16\na=ssrc:1932486814 cname:1af30a2f01e36ab9\n\n', 'SIP/2.0 100 Giving a try\nFrom: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff\nTo: "4794001002" <sip:4794001002@192.168.56.112;user=phone>\nCSeq: 21343 INVITE\nCall-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111\nVia: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_21505e85-9471-4e8c-9fea-e3dfd9c2676e\nServer: OpenSIPS (2.4.11 (x86_64/linux))\nContent-Length: 0\n\n\n', 'SIP/2.0 180 Ringing\nVia: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_21505e85-9471-4e8c-9fea-e3dfd9c2676e\nRecord-Route: <sip:192.168.56.112;lr;ftag=21075484_e95e2fe2_f42f003e_1402ffff;did=c12.3a3df197>\nCall-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111\nFrom: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff\nTo: "4794001002" <sip:4794001002@192.168.56.112;user=phone>;tag=a1ea84fc683b4245aa9e244ca0fb73e0\nCSeq: 21343 INVITE\nContact: <sip:4794001002@192.168.56.1:60129;ob>\nAllow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS\nContent-Length: 0\n\n\n', 'SIP/2.0 180 Ringing\nCSeq: 21343 INVITE\nCall-ID: 7aa1d274185a463694dad4ad56aa5bf0\nFrom: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525\nTo: <sip:4794001002@192.168.56.112>;tag=68947609_e95e2fe2_f42f003e_1402ffff\nVia: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK4b7b.b8a4c295.0\nVia: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj0d59e3092ef347b0941a21790d0dcc2f\nRecord-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525;did=82f.f488142>\nServer: Gintel TelScale/312061d8e\nContact: <sip:192.168.56.111:5060>\nAllow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS\nContent-Length: 0\n\n\n', 'SIP/2.0 200 OK\nVia: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_21505e85-9471-4e8c-9fea-e3dfd9c2676e\nRecord-Route: <sip:192.168.56.112;lr;ftag=21075484_e95e2fe2_f42f003e_1402ffff;did=c12.3a3df197>\nCall-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111\nFrom: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff\nTo: "4794001002" <sip:4794001002@192.168.56.112;user=phone>;tag=a1ea84fc683b4245aa9e244ca0fb73e0\nCSeq: 21343 INVITE\nAllow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS\nContact: <sip:4794001002@192.168.56.1:60129;ob>\nSupported: replaces,100rel,timer,norefersub\nSession-Expires: 90;refresher=uac\nRequire: timer\nContent-Type: application/sdp\nContent-Length: 313\n\nv=0\no=- 3926573523 3926573524 IN IP4 10.254.8.178\ns=pjmedia\nb=AS:84\nt=0 0\na=X-nat:0\nm=audio 4000 RTP/AVP 8 101\nc=IN IP4 10.254.8.178\nb=TIAS:64000\na=rtcp:4001 IN IP4 10.254.8.178\na=sendrecv\na=rtpmap:8 PCMA/8000\na=rtpmap:101 telephone-event/8000\na=fmtp:101 0-16\na=ssrc:2705443 cname:39b32d12074d4dc8\n\n', 'SIP/2.0 200 OK\nCSeq: 21343 INVITE\nCall-ID: 7aa1d274185a463694dad4ad56aa5bf0\nFrom: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525\nTo: <sip:4794001002@192.168.56.112>;tag=68947609_e95e2fe2_f42f003e_1402ffff\nVia: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK4b7b.b8a4c295.0\nVia: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj0d59e3092ef347b0941a21790d0dcc2f\nRecord-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525;did=82f.f488142>\nServer: Gintel TelScale/312061d8e\nContact: <sip:192.168.56.111:5060>\nAllow: PRACK,INVITE,ACK,BYE,CANCEL,UPDATE,INFO,SUBSCRIBE,NOTIFY,REFER,MESSAGE,OPTIONS\nSupported: replaces,100rel,timer,norefersub\nSession-Expires: 1800;refresher=uac\nRequire: timer\nContent-Type: application/sdp\nContent-Length: 313\n\nv=0\no=- 3926573523 3926573524 IN IP4 10.254.8.178\ns=pjmedia\nb=AS:84\nt=0 0\na=X-nat:0\nm=audio 4000 RTP/AVP 8 101\nc=IN IP4 10.254.8.178\nb=TIAS:64000\na=rtcp:4001 IN IP4 10.254.8.178\na=sendrecv\na=rtpmap:8 PCMA/8000\na=rtpmap:101 telephone-event/8000\na=fmtp:101 0-16\na=ssrc:2705443 cname:39b32d12074d4dc8\n\n', 'ACK sip:192.168.56.111:5060 SIP/2.0\nRecord-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525>\nVia: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK4b7b.b8a4c295.2\nVia: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj37d31f3fcfab4805bff60cd48865f328\nMax-Forwards: 69\nFrom: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525\nTo: <sip:4794001002@192.168.56.112>;tag=68947609_e95e2fe2_f42f003e_1402ffff\nCall-ID: 7aa1d274185a463694dad4ad56aa5bf0\nCSeq: 21343 ACK\nContent-Length: 0\n\n\n', 'ACK sip:4794001002@192.168.56.1:60129;ob SIP/2.0\nCall-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111\nCSeq: 21343 ACK\nFrom: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff\nTo: "4794001002" <sip:4794001002@192.168.56.112;user=phone>;tag=a1ea84fc683b4245aa9e244ca0fb73e0\nMax-Forwards: 70\nUser-Agent: Gintel TelScale/312061d8e\nRoute: <sip:192.168.56.112;lr;ftag=21075484_e95e2fe2_f42f003e_1402ffff;did=c12.3a3df197>\nContent-Length: 0\n\n\n', 'BYE sip:192.168.56.111:5060 SIP/2.0\nRecord-Route: <sip:192.168.56.112;lr;ftag=d7a9853513c846928a30b054496ff525>\nVia: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK1b7b.df675642.0\nVia: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj2c6e3f67cfac40fa984c3d94bcea3af0\nMax-Forwards: 69\nFrom: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525\nTo: <sip:4794001002@192.168.56.112>;tag=68947609_e95e2fe2_f42f003e_1402ffff\nCall-ID: 7aa1d274185a463694dad4ad56aa5bf0\nCSeq: 21344 BYE\nUser-Agent: MicroSIP/3.20.7\nContent-Length: 0\n\n\n', 'SIP/2.0 200 OK\nCSeq: 21344 BYE\nCall-ID: 7aa1d274185a463694dad4ad56aa5bf0\nFrom: "44779790101-VM" <sip:44779790101@192.168.56.112>;tag=d7a9853513c846928a30b054496ff525\nTo: <sip:4794001002@192.168.56.112>;tag=68947609_e95e2fe2_f42f003e_1402ffff\nVia: SIP/2.0/UDP 192.168.56.112:5060;branch=z9hG4bK1b7b.df675642.0\nVia: SIP/2.0/UDP 192.168.56.1:64489;received=192.168.56.1;rport=64489;branch=z9hG4bKPj2c6e3f67cfac40fa984c3d94bcea3af0\nServer: Gintel TelScale/312061d8e\nContent-Length: 0\n\n\n', 'BYE sip:4794001002@192.168.56.1:60129;ob SIP/2.0\nCSeq: 21344 BYE\nFrom: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff\nTo: "4794001002" <sip:4794001002@192.168.56.112;user=phone>;tag=a1ea84fc683b4245aa9e244ca0fb73e0\nCall-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111\nMax-Forwards: 70\nUser-Agent: Gintel TelScale/312061d8e\nVia: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_e8bea4d5-5cb9-4f9c-95ef-a34b8eb58402\nRoute: <sip:192.168.56.112;lr;ftag=21075484_e95e2fe2_f42f003e_1402ffff;did=c12.3a3df197>\nContent-Length: 0\n\n\n', 'SIP/2.0 200 OK\nVia: SIP/2.0/UDP 192.168.56.111:5060;branch=z9hG4bK1402ffff_f42f003e_e8bea4d5-5cb9-4f9c-95ef-a34b8eb58402\nRecord-Route: <sip:192.168.56.112;lr;ftag=21075484_e95e2fe2_f42f003e_1402ffff>\nCall-ID: 59c8a2758aff88e52107a4ad4d9ff53b@192.168.56.111\nFrom: "44779790101" <sip:44779790101@192.168.56.112;user=phone>;tag=21075484_e95e2fe2_f42f003e_1402ffff\nTo: "4794001002" <sip:4794001002@192.168.56.112;user=phone>;tag=a1ea84fc683b4245aa9e244ca0fb73e0\nCSeq: 21344 BYE\nContent-Length: 0\n\n\n']
        # chosen_header = header[index].split('\n')
        chosen_header = re.split(r'\n+', header[index])
        return chosen_header

    def extract_header(self, index):
        header = self.split_header_array(index)
        SIP_header, SDP_elements = self.separate_SIP_and_SDP(header)
        message_type = header[0]
        sip_to = None
        sip_from = None
        sip_content = []
        SDP_content = []
        for x in SIP_header:
            if x.startswith("To:"):
                sip_to = x[3:-1]
            elif x.startswith("From:"):
                sip_from = x[5:-1]
            else: 
                sip_content.append(x)
        for x in SDP_elements:
                SDP_content.append(x)
        return message_type, sip_to, sip_from, sip_content, SDP_content
    
        
    # Separate SIP and SDP when SDP exsist
    def separate_SIP_and_SDP(self, header):
        content_length = None
        SDP_exists = False
        for x in header:
            if x.startswith("Content-Length:"):
                content_length = x

        _, number_str = content_length.split(":")
        content_length_value = int(number_str)
        if content_length_value > 0:
            SDP_exists = True

        SIP_header = []
        SDP_elements = []
        if SDP_exists:
            for x in header:
                if len(x) >= 2 and x[1] == '=':
                    SDP_elements.append(x)
                else:
                    SIP_header.append(x)


        return SIP_header, SDP_elements








if __name__ == "__main__":
    logPath = "./logs"

    extractor = Extractor( logPath + "/" + "1.adapter.windows.log", "output.log")

    # entries = extractor.read_sip()
    # print(entries)
    # print('----------------')
    # print(entries[0])
    # print('----------------')   
    # for entry in entries[0]:
    #     print(entry)
    # for entry in entries[1]:
    #     print(entry)


    # test = extractor.convert_to_json()
    # print(test)

    test = extractor.extract_header(0)
    print(test)
