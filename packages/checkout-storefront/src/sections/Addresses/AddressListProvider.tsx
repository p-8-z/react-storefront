import React, { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { createSafeContext } from "@/checkout-storefront/providers/createSafeContext";
import { getById, getByUnmatchingId } from "@/checkout-storefront/lib/utils";
import {
  AddressFragment,
  useUserAddressCreateMutation,
  useUserAddressDeleteMutation,
  useUserAddressUpdateMutation,
  useUserQuery,
} from "@/checkout-storefront/graphql";
import { useAuthState } from "@saleor/sdk";
import {
  AddressFormData,
  UserAddressFormData,
} from "@/checkout-storefront/sections/Addresses/types";
import { extractMutationErrors } from "@/checkout-storefront/lib/utils";
import {
  getAddressInputData,
  isMatchingAddress,
} from "@/checkout-storefront/sections/Addresses/utils";
import { useAlerts } from "@/checkout-storefront/hooks";
import { debounce, findIndex } from "lodash-es";

interface AddressListProviderProps {
  onCheckoutAddressUpdate: (address: Address) => void;
  defaultAddress: Address | undefined | null;
}

type SubmitReturnWithErrors = Promise<{ hasErrors: boolean; errors?: any[] }>;

interface ContextConsumerProps {
  addressList: Address[];
  selectedAddressId: string | undefined;
  setSelectedAddressId: (id: string) => void;
  addressUpdate: (formData: UserAddressFormData) => SubmitReturnWithErrors;
  addressCreate: (formData: AddressFormData) => SubmitReturnWithErrors;
  addressDelete: (id: string) => SubmitReturnWithErrors;
  updating: boolean;
  deleting: boolean;
  creating: boolean;
}

export const [useAddressList, Provider] = createSafeContext<ContextConsumerProps>();

export type AddressList = Address[];
export type Address = AddressFragment;

export const AddressListProvider: React.FC<PropsWithChildren<AddressListProviderProps>> = ({
  children,
  onCheckoutAddressUpdate,
  defaultAddress,
}) => {
  const { user: authUser } = useAuthState();
  const [{ data }] = useUserQuery({
    pause: !authUser?.id,
  });

  const { showErrors } = useAlerts();

  const user = data?.me;
  const addresses = user?.addresses || [];

  const [{ fetching: updating }, userAddressUpdate] = useUserAddressUpdateMutation();
  const [{ fetching: deleting }, userAddressDelete] = useUserAddressDeleteMutation();
  const [{ fetching: creating }, userAddressCreate] = useUserAddressCreateMutation();

  const [addressList, setAddressList] = useState<AddressList>(addresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(
    defaultAddress?.id
  );

  const getSelectedAddress = (id: string | undefined = selectedAddressId) =>
    addressList.find(getById(id));

  const addressUpdate = async (formData: UserAddressFormData) => {
    const result = await userAddressUpdate({
      address: getAddressInputData({
        ...formData,
      }),
      id: formData.id,
    });

    const [hasErrors, errors] = extractMutationErrors(result);

    if (hasErrors) {
      showErrors(errors, "userAddressUpdate");
      return { hasErrors, errors };
    }

    const address = result?.data?.accountAddressUpdate?.address as Address;

    const addressIndex = findIndex(addressList, ({ id }) => id === address.id);

    const updatedList = [...addressList];
    updatedList.splice(addressIndex, 1, address);

    setAddressList(updatedList);
    setSelectedAddressId(address.id);

    void onCheckoutAddressUpdate(address);
    return { hasErrors: false };
  };

  const addressDelete = async (id: string) => {
    const result = await userAddressDelete({
      id,
    });

    const [hasErrors, errors] = extractMutationErrors(result);

    if (hasErrors) {
      showErrors(errors, "userAddressDelete");
    }

    setAddressList(addressList.filter(getByUnmatchingId(id)));

    if (selectedAddressId === id && addressList[0]) {
      const newAddress = addressList[0];
      setSelectedAddressId(newAddress.id);
      void onCheckoutAddressUpdate(newAddress);
    }

    return { hasErrors, errors };
  };

  const addressCreate = async (formData: AddressFormData) => {
    const result = await userAddressCreate({
      address: getAddressInputData({
        ...formData,
      }),
    });

    const [hasErrors, errors] = extractMutationErrors(result);

    if (hasErrors) {
      showErrors(errors, "userAddressCreate");
    } else {
      const address = result?.data?.accountAddressCreate?.address as Address;

      setAddressList([...addressList, address]);
      setSelectedAddressId(address.id);
      void onCheckoutAddressUpdate(address);
    }

    return { hasErrors, errors };
  };

  useEffect(() => {
    if (isMatchingAddress(defaultAddress, getSelectedAddress())) {
      return;
    }

    const matchingAddress = addressList.find((address) =>
      isMatchingAddress(defaultAddress, address)
    );

    setSelectedAddressId(matchingAddress?.id as string);
  }, [defaultAddress]);

  const debouncedUpdate = useCallback(
    debounce((address: Address) => {
      void onCheckoutAddressUpdate(address);
    }, 2000),
    []
  );

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    debouncedUpdate(getSelectedAddress(addressId) as Address);
  };

  const providerValues: ContextConsumerProps = {
    addressList,
    setSelectedAddressId: handleAddressSelect,
    selectedAddressId,
    addressCreate,
    addressUpdate,
    addressDelete,
    deleting,
    updating,
    creating,
  };

  return <Provider value={providerValues}>{children}</Provider>;
};
