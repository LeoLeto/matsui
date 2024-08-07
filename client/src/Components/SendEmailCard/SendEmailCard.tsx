import { Button } from "@nextui-org/button";
import { Input, Textarea } from "@nextui-org/input";
import { Dispatch, SetStateAction, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { useMediaQuery } from "react-responsive";
import { toast } from "react-toastify";
import { api } from "../../State/api";
import { UserInterface } from "../../interfaces/interfaces";
import "./SendEmailCard.scss";

interface SendEmailCardProps {
  setIsSendEmailActive: Dispatch<SetStateAction<boolean>>;
  selectedUsers: UserInterface[] | undefined;
}

export default function SendEmailCard({
  setIsSendEmailActive,
  selectedUsers,
}: SendEmailCardProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSendingEmailSpinnerVisible, setIsSendingEmailSpinnerVisible] =
    useState<boolean>(false);
  const [triggerSendEmail] = api.endpoints.sendEmail.useLazyQuery();

  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  const triggerSentEmailNotification = () => toast("📨 Email sent!");

  const handleSendEmail = () => {
    // console.log(subject, message, selectedUsers);

    const recipientEmails = selectedUsers?.map((selectedUser) => {
      return selectedUser.email;
    });
    if (recipientEmails !== undefined) {
      // console.log("recipientEmails: ", recipientEmails);
      setIsSendingEmailSpinnerVisible(true);

      const sendEmailPayload = {
        recipients: recipientEmails,
        subject: subject,
        message: message,
      };

      triggerSendEmail(sendEmailPayload)
        .unwrap()
        .then((payload: any) => {
          if (payload.message === "Message sent") {
            triggerSentEmailNotification();
            setSubject("");
            setMessage("");
            setIsSendingEmailSpinnerVisible(false);
          }
        })
        .catch((error) => console.error("rejected", error));
    }
  };

  return (
    <>
      <div
        className={
          isMobile ? "card sendEmailCard mobileLayout" : "card sendEmailCard"
        }
      >
        <span className="sendEmailCardColumn" style={{ flex: 1 }}>
          <div>RECIPIENTS</div>
          <ul className="emailRecipientsContainer">
            {selectedUsers &&
              selectedUsers.map((selectedUser) => {
                return (
                  <li key={selectedUser._id}>
                    <span>{selectedUser.email}</span>
                  </li>
                );
              })}
            {selectedUsers && selectedUsers.length === 0 && (
              <div>No recipients selected</div>
            )}
          </ul>
        </span>
        <span className="sendEmailCardColumn" style={{ flex: 2 }}>
          <Input
            label="SUBJECT"
            labelPlacement={isMobile ? "inside" : "outside-left"}
            type="text"
            variant="bordered"
            value={subject}
            onValueChange={setSubject}
            fullWidth={true}
          />

          <Textarea
            labelPlacement={isMobile ? "inside" : "outside-left"}
            label="MESSAGE"
            variant="bordered"
            minRows={4}
            maxRows={4}
            disableAnimation
            value={message}
            onValueChange={setMessage}
          />
          <div style={{ display: "flex", justifyContent: "end", gap: "1rem" }}>
            <Button
              variant="ghost"
              color="danger"
              size="sm"
              startContent={<FaX />}
              onClick={() => {
                setIsSendEmailActive(false);
              }}
            >
              Discard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              color="primary"
              startContent={<FaPaperPlane />}
              isDisabled={subject.length < 5 || message.length < 15}
              isLoading={isSendingEmailSpinnerVisible}
              onClick={handleSendEmail}
            >
              Send
            </Button>
          </div>
        </span>
      </div>
    </>
  );
}
