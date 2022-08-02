import { Button } from "@/checkout-storefront/components/Button";
import { TextInput } from "@/checkout-storefront/components/TextInput";
import { useCheckoutAddPromoCodeMutation } from "@/checkout-storefront/graphql";
import { useAlerts } from "@/checkout-storefront/hooks/useAlerts";
import { useCheckout } from "@/checkout-storefront/hooks/useCheckout";
import { useErrors } from "@/checkout-storefront/hooks/useErrors";
import { useFormattedMessages } from "@/checkout-storefront/hooks/useFormattedMessages";
import { useGetInputProps } from "@/checkout-storefront/hooks/useGetInputProps";
import { useSetFormErrors } from "@/checkout-storefront/hooks/useSetFormErrors";
import { extractMutationErrors, useValidationResolver } from "@/checkout-storefront/lib/utils";
import React from "react";
import { useForm } from "react-hook-form";
import { object, string } from "yup";

interface FormData {
  promoCode: string;
}

export const PromoCodeAdd = () => {
  const { checkout } = useCheckout();
  const formatMessage = useFormattedMessages();
  const { setApiErrors, errors } = useErrors<FormData>();
  const { showErrors } = useAlerts("checkoutAddPromoCode");

  const schema = object({
    code: string(),
  });
  const resolver = useValidationResolver(schema);

  const [, checkoutAddPromoCode] = useCheckoutAddPromoCodeMutation();

  const formProps = useForm<FormData>({ resolver, defaultValues: { promoCode: "" } });
  const { handleSubmit, watch, setError, reset } = formProps;
  // @ts-ignore
  const getInputProps = useGetInputProps(formProps);

  const showApplyButton = !!watch("promoCode");

  const onSubmit = async ({ promoCode }: FormData) => {
    const result = await checkoutAddPromoCode({ promoCode, checkoutId: checkout.id });
    const [hasErrors, apiErrors] = extractMutationErrors(result);

    if (hasErrors) {
      setApiErrors(apiErrors);
      showErrors(apiErrors);
      return;
    }

    reset();
  };

  useSetFormErrors<FormData>({
    setError,
    errors,
  });

  return (
    <div className="relative mx-4">
      <TextInput label={formatMessage("addDiscount")} {...getInputProps("promoCode")} optional />
      {showApplyButton && (
        <Button
          className="absolute right-3 top-3"
          variant="tertiary"
          ariaLabel={formatMessage("applyButtonLabel")}
          label={formatMessage("apply")}
          onClick={handleSubmit(onSubmit)}
        />
      )}
    </div>
  );
};
