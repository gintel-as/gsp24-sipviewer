import re


class createDynamicSIPpMessages:
    def __init__(self, log_file, output_file):
        self.log_file = log_file
        self.output_file = output_file
        self.headers_added = []  # Prevents certain headers to be added twice
        self.initial_invite = True
        self.initial_response = True
        self.filterHeaders = ["Record-Route:",
                              "Route:", "P-hint:",
                              "X-Rimssf-ServiceKey:",
                              "Content-Length:",
                              "X-Gt-SessionId:"]
        self.last_RSeq = None
        self.content_length_added = False
        self.last_direction = None
        self.receiver = False
        self.leg_array = []

    def read_log(self):
        timestamp_pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}"
        message_filter = r"IVR$|MS.$"  # Line which ends with either IVR or MS.
        message_type = None
        skip_line = False
        request_msg = None
        save_info = False

        with open(self.log_file, 'r') as input_file:
            with open(self.output_file, 'w') as output_file:
                for line in input_file:             
                    if re.search(message_filter, line):
                        skip_line = True  # Skip sections below message_filter
                        continue

                    line = line.strip()

                    if re.match(timestamp_pattern, line):
                        save_info = False
                        skip_line = False
                        timestamp = re.search(timestamp_pattern, line)
                        leg = " ".join(line.split(" ")[-2:])
                        if not self.content_length_added:
                            output_file.write("Content-Length: [len]")
                        self.content_length_added = False

                        # Checks if the user-agent is switching from receiver to sender. If so, it will add a comment for manual configuration
                        if self.last_direction != None and self.last_direction.split(" ")[1] == leg.split(" ")[1] and self.last_direction.split(" ")[0] == "to" and leg.split(" ")[0] == "from":
                            save_info = True

                        # Identifies if user-agent is a reciever, while while excluding the initial sending user-agent
                        if leg.split(" ")[0] == "from":
                            # Adds the user-agent into array in the order they run
                            if leg.split(" ")[1] not in self.leg_array:
                                self.leg_array.append(leg.split(" ")[1])
                            # Uses save_info to determine change to receiving and checks if the user-agent is not initial sender
                            if leg.split(" ")[1] in self.leg_array and self.leg_array.index(leg.split(" ")[1]) != 0:
                                self.receiver = True
                            else:
                                self.receiver = False
                        else:
                            self.receiver = False

                        if self.last_direction is not leg:
                            self.last_direction = leg

                        note = ""
                        self.via_included = False
                        output_file.write("\n\n")
                        if save_info:
                            note += "<--Direction_change!-->"
                        output_file.write(
                            timestamp.group() + " " + leg + "\n" + note + "\n")
                        self.headers_added = []
                        continue

                    if skip_line:
                        continue
                    line_start = line.split(" ")[0]
                    line_end = line.split(" ")[-1]

                    if line_end == "SIP/2.0":  # Define message type if it has a code
                        message_type = line_start
                        request_msg = True
                    elif line_start == "SIP/2.0":
                        message_type = line.split(" ")[-2]
                        request_msg = False

                    if leg.split(" ")[0] == "to":
                        new_line = line
                    else:
                        new_line = self.transform_line(
                            line,
                            message_type,
                            request_msg
                        )
                    output_file.write(new_line)
                    if new_line != "":  # If last line wasn't blank, skip a line
                        output_file.write("\n")
                output_file.write("Content-Length: [len]\n")

    def transform_line(self, line, message_type, request_msg):
        line_start = line.split(" ")[0]
        line_end = line.split(" ")[-1]

        if line_start == "Call-ID:":
            new_line = "Call-ID: [call_id]"
            return new_line

        if line_start == "Max-Forwards:":
            new_line = "Max-Forwards: 70"
            return new_line

        if line_start == "Record-Route:" or line_start == "Route:":
            new_line = ""
            if request_msg and "Route:" not in self.headers_added:
                new_line = "[routes]"
                self.headers_added.append("Route:")
            elif not request_msg and "Record-Route:" not in self.headers_added:
                new_line = "[last_Record-Route]"
                self.headers_added.append("Record-Route:")
            return new_line

        if line_start in self.filterHeaders:
            new_line = ""
            return new_line

        # Identifies all SDP with IP-adresses and changes them
        if len(line_start) > 1 and line_start[1] == '=':

            filtered_line = line.split(" ")[-1]
            if line_start == "m=audio":
                new_line = line_start + \
                    " [media_port] " + " ".join(line.split(" ")[2:])
                return new_line
            if re.match(r"\b(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b", filtered_line):
                new_line = " ".join(line.split(
                    " ")[:-1])[:-3] + "IP[local_ip_type] [local_ip]"
                return new_line

        if not self.content_length_added and len(line_start) > 1 and line_start[1] == '=':
            line = "Content-Length: [len]\n" + line
            self.content_length_added = True

        if request_msg:
            new_line = self.transform_request(
                line,
                message_type
            )
        elif not request_msg:
            new_line = self.transform_response(
                line,
                message_type
            )

        if line_start == "RSeq:":
            self.last_RSeq = line_end

        return new_line

    def transform_request(self, line, message_type):
        line_start = line.split(" ")[0]
        line_end = line.split(" ")[-1]
        reverse_field = False

        if self.receiver:
            reverse_field = True

        if line_end == "SIP/2.0":
            new_line = f"{line_start} sip:[field1 line=0]@[remote_ip]:[remote_port] SIP/2.0"
            if reverse_field:
                new_line = f"{line_start} sip:[field1 line=1]@[remote_ip]:[remote_port] SIP/2.0"
            if message_type in ["ACK", "BYE", "PRACK"]:
                new_line = f"{line_start} [next_url] SIP/2.0"
            return new_line

        if line_start == "Contact:":
            new_line = "Contact: sip:[field1 line=1]@[local_ip]:[local_port]"
            if reverse_field:
                new_line = "Contact: sip:[field0 line=0]@[local_ip]:[local_port]"
            return new_line

        if line_start == "Via:":
            if line_start not in self.headers_added:
                new_line = "Via: SIP/2.0/[transport] [local_ip]:[local_port];branch=[branch]"
                self.headers_added.append(line_start)
                return new_line
            return ""

        if line_start == "From:":
            new_line = "From: [field0 line=1] <sip:[field1 line=1]@[local_ip]:[local_port]>"
            if reverse_field:
                new_line = "From: [field0 line=0] <sip:[field1 line=0]@[local_ip]:[local_port]>"
            new_line += ";tag=[pid]SIPpTag00[call_number]"
            return new_line

        if line_start == "To:":
            new_line = "To: <sip:[field1 line=0]@[remote_ip]:[remote_port]>"
            if reverse_field:
                new_line = "To: <sip:[field1 line=1]@[remote_ip]:[remote_port]>"
            if not self.initial_invite:
                new_line += "[peer_tag_param]"
            else:
                self.initial_invite = False
            return new_line

        if line_start == "RAck:" and message_type == "PRACK":
            new_line = line_start + " " + str(self.last_RSeq) + " " + \
                " ".join(line.split(" ")[-2:])
            return new_line
        
        return line

    def transform_response(self, line, message_type):
        line_start = line.split(" ")[0]

        if line_start == "SIP/2.0":
            return line

        if line_start == "Contact:":
            new_line = "Contact: sip:[local_ip]:[local_port];transport=[transport]"
            return new_line
        
        if line_start == "Via:":
            new_line = "[last_via]"
            return new_line

        if line_start == "From:":
            new_line = "[last_From:]"
            return new_line

        if line_start == "To:":
            new_line = "[last_To]"
            if self.initial_response and message_type in ["180", "183", "200"]:
                new_line += ";tag=[pid]SIPpTag00[call_number]"
            return new_line

        if line_start == "CSeq:":
            new_line = "[last_CSeq]"
            return new_line

        if self.initial_invite:
            self.initial_invite = False

        if self.initial_response and message_type == "200":
            self.initial_response = False

        return line  # Return same line if no logic above applies


if __name__ == "__main__":
    create_dynamic_SIPp_messages = createDynamicSIPpMessages(
        "../logFiles/304286683/304286683.log", "../logFiles/result.log")
    create_dynamic_SIPp_messages.read_log()
