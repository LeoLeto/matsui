import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";
import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/popover";
import { Select, SelectItem } from "@nextui-org/select";
import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { UserInterface } from "../../../interfaces/interfaces";
import { useUpdateUserMutation } from "../../../State/api";
import { returnFormattedDate } from "../../../Utilities/returnFormattedDate";
import { returnUniqueCompanies } from "../../../Utilities/returnUniqueCompanies";

interface EditUserModalProps {
  isOpen: boolean;
  onOpenChange: (value: boolean) => void;
  selectedUser: UserInterface | undefined;
  setSelectedUser: React.Dispatch<
    React.SetStateAction<UserInterface | undefined>
  >;
  refetchUsers: () => void;
  fetchedUsers: UserInterface[];
}
export default function EditUserModal({
  isOpen,
  onOpenChange,
  selectedUser,
  setSelectedUser,
  refetchUsers,
  fetchedUsers,
}: EditUserModalProps) {
  const [updateUser] = useUpdateUserMutation();
  const [userUsername, setUserUsername] = useState<string>("");
  const [newCompany, setNewCompany] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [companies, setCompanies] = useState<{ name: string }[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    "Active" | "Inactive" | "Unverified"
  >("Inactive");

  const triggerUpdatedUserNotification = () => toast("😁 User updated!");

  async function handleSaveUser() {
    if (selectedUser) {
      const updatedUser = {
        ...selectedUser,
        username: userUsername,
        company: selectedCompany,
        status: selectedStatus,
      };
      setSelectedUser(updatedUser);
      await updateUser(updatedUser)
        .unwrap()
        .then(async (response: any) => {
          if (response.modifiedCount === 1) {
            refetchUsers();
            triggerUpdatedUserNotification();
          }
          onOpenChange(false);
        });
    }
  }

  function handleAddCompany() {
    // console.log(newCompany);
    setSelectedCompany(newCompany);
    const updatedCompanies = [...companies, { name: newCompany }];
    setCompanies(updatedCompanies);
    setNewCompany("");
    setIsPopoverOpen(false);
  }

  useEffect(() => {
    if (selectedUser) {
      setUserUsername(selectedUser.username);
      setSelectedCompany(selectedUser.company);
      setSelectedStatus(selectedUser.status);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (fetchedUsers) {
      const extractedCompanies = returnUniqueCompanies(fetchedUsers);
      setCompanies(extractedCompanies);
    }
  }, [fetchedUsers]);

  return (
    <>
      {selectedUser && (
        <>
          <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            scrollBehavior="outside"
            placement="top-center"
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    Edit user
                  </ModalHeader>
                  <ModalBody>
                    <Input
                      label="Full name"
                      type="text"
                      variant="bordered"
                      value={userUsername}
                      onChange={(event) => {
                        setUserUsername(event.target.value);
                      }}
                    />
                    <Select
                      label="Status"
                      variant="bordered"
                      placeholder="Select a company"
                      selectedKeys={new Set([selectedStatus])}
                      isDisabled={selectedUser.status === "Unverified"}
                      disabledKeys={["Unverified"]}
                      onSelectionChange={(keys) => {
                        setSelectedStatus(
                          Array.from(keys)[0] as
                            | "Active"
                            | "Inactive"
                            | "Unverified"
                        );
                      }}
                    >
                      <SelectItem key="Active">Active</SelectItem>
                      <SelectItem key="Inactive">Inactive</SelectItem>
                      <SelectItem key="Unverified" isReadOnly={true}>
                        Unverified
                      </SelectItem>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Select
                        label="Company"
                        variant="bordered"
                        placeholder="Select a company"
                        selectedKeys={new Set([selectedCompany])}
                        onSelectionChange={(keys) =>
                          setSelectedCompany(String(Array.from(keys)[0]))
                        }
                      >
                        {companies.map((company) => (
                          <SelectItem key={company.name}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </Select>
                      <Popover
                        placement="bottom-end"
                        isOpen={isPopoverOpen}
                        onOpenChange={(open) => setIsPopoverOpen(open)}
                      >
                        <PopoverTrigger>
                          <Button variant="light" size="sm" color="primary">
                            Add company
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="px-1 py-2">
                            <div className="flex items-center text-tiny text-center">
                              <Input
                                className="mr-4"
                                label="New company name"
                                type="text"
                                value={newCompany}
                                onChange={(event) => {
                                  setNewCompany(event.target.value);
                                }}
                              />
                              <Button
                                isIconOnly={true}
                                color="success"
                                onPress={handleAddCompany}
                              >
                                <FaPlus color="white" fontSize={16} />
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Input
                      label="Email"
                      type="text"
                      disabled
                      value={selectedUser?.email}
                    />
                    <Input
                      label="Supplier"
                      type="text"
                      disabled
                      value={selectedUser?.supplier}
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      disabled
                      value={String(selectedUser?.phone)}
                    />
                    <Input
                      label="Registration date"
                      type="text"
                      disabled
                      value={returnFormattedDate(
                        selectedUser!.registrationDate
                      )}
                    />
                    <Input
                      label="Last access"
                      type="text"
                      disabled
                      value={returnFormattedDate(selectedUser!.lastAccess)}
                    />
                    <Input
                      label="Created formulas"
                      type="number"
                      disabled
                      value={String(selectedUser?.createdFormulas)}
                    />
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Close
                    </Button>
                    <Button color="primary" onPress={handleSaveUser}>
                      Save changes
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </>
      )}
    </>
  );
}
