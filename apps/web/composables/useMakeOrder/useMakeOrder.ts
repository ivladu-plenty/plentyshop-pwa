import type { Order, MakeOrderParams } from '@plentymarkets/shop-api';
import { toRefs } from '@vueuse/shared';
import type { UseMakeOrderState, UseMakeOrderReturn, CreateOrder, ErrorMapper } from '~/composables/useMakeOrder/types';
import { useSdk } from '~/sdk';

const showContentInIframe = (): void => {
  // show external content in iframe
};

const serverErrorHandler = (): void => {
  // NotificationService.error(paymentValue);
};

const defaultErrorHandler = (): void => {
  // NotificationService.error(paymentValue);
};

/**
 * @description Composable for managing order creation.
 * @return UseMakeOrderReturn
 * @example
 * ``` ts
 * const { data, loading, createOrder } = useMakeOrder();
 * ```
 */
export const useMakeOrder: UseMakeOrderReturn = () => {
  const state = useState<UseMakeOrderState>('useMakeOrder', () => ({
    data: {} as Order,
    loading: false,
  }));

  /**
   * @description Function for creating an order
   * @param params { MakeOrderParams }
   * @return CreateOrder
   * @example
   * ``` ts
   * createOrder({
   *    paymentId: 1, // Method of payment
   *    shippingPrivacyHintAccepted: true,
   * });
   * ```
   */
  const createOrder: CreateOrder = async (params: MakeOrderParams) => {
    state.value.loading = true;

    await useAsyncData(() =>
      useSdk().plentysystems.doAdditionalInformation({
        orderContactWish: null,
        orderCustomerSign: null,
        shippingPrivacyHintAccepted: params.shippingPrivacyHintAccepted,
        templateType: 'checkout',
      }),
    );

    const { data: preparePaymentData, error: preparePaymentError } = await useAsyncData(() =>
      useSdk().plentysystems.doPreparePayment(),
    );

    useHandleError(preparePaymentError.value);

    const paymentType = preparePaymentData.value?.data.type || 'errorCode';
    const paymentValue = preparePaymentData.value?.data.value || '""';

    const asyncContinueOrHtml = async () => {
      const { data, error } = await useAsyncData(() => useSdk().plentysystems.doPlaceOrder());

      useHandleError(error.value);

      if (error.value) {
        state.value.loading = false;
        return {} as Order;
      }

      state.value.data = data.value?.data ?? state.value.data;

      await useAsyncData(() =>
        useSdk().plentysystems.doExecutePayment({
          orderId: state.value.data.order.id,
          paymentId: params.paymentId,
        }),
      );
    };

    const redirectToPayment = (): void => {
      window.location.assign(paymentValue);
    };

    const errorMapper: ErrorMapper = {
      continue: asyncContinueOrHtml,
      htmlContent: asyncContinueOrHtml,
      redirectUrl: redirectToPayment,
      externalContentUrl: showContentInIframe,
      errorCode: serverErrorHandler,
      defaultError: defaultErrorHandler,
    };

    // console.log('x', paymentType, paymentValue);

    errorMapper[paymentType]();

    // switch (paymentType) {
    //   case 'continue':
    //   case 'htmlContent': {
    //     const { data, error } = await useAsyncData(() => useSdk().plentysystems.doPlaceOrder());
    //     console.log('1', paymentType, paymentValue);
    //     useHandleError(error.value);
    //     if (error.value) {
    //       state.value.loading = false;
    //       return {} as Order;
    //     }

    //     state.value.data = data.value?.data ?? state.value.data;

    //     await useAsyncData(() =>
    //       useSdk().plentysystems.doExecutePayment({
    //         orderId: state.value.data.order.id,
    //         paymentId: params.paymentId,
    //       }),
    //     );
    //     break;
    //   }
    //   case 'redirectUrl': {
    //     // redirect to given payment provider
    //     console.log('2', paymentType, paymentValue);
    //     window.location.assign(paymentValue);
    //     break;
    //   }
    //   case 'externalContentUrl': {
    //     // show external content in iframe
    //     break;
    //   }

    //   case 'errorCode': {
    //     // NotificationService.error(paymentValue);
    //     break;
    //   }
    //   default: {
    //     // NotificationService.error("Unknown response from payment provider: " + paymentType);
    //     break;
    //   }
    // }

    state.value.loading = false;
    return state.value.data;
  };

  return {
    createOrder,
    ...toRefs(state.value),
  };
};
