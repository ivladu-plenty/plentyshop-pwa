import { toRefs } from '@vueuse/shared';
import { sdk } from '~/sdk';
import type { UseProductReviews, UseProductReviewsState, FetchProductReviews } from './types';

/**
 * @description Composable managing product reviews data
 * @param {string} slug Product slug
 * @returns {@link UseProductReturn}
 * @example
 * const { data, loading, fetchProductReviews } = useProductReviews('product-slug');
 */
export const useProductReviews: UseProductReviews = (slug) => {
  const state = useState<UseProductReviewsState>(`useProductReviews-${slug}`, () => ({
    data: null,
    loading: false,
  }));

  /** Function for fetching product reviews data
   * @param {string} slug Product slug
   * @example
   * fetchProductReviews('product-slug');
   */
  const fetchProductReviews: FetchProductReviews = async (slug) => {
    state.value.loading = true;
    const { data, error } = await useAsyncData(() => sdk.plentysystems.getProductReviews({ slug }));
    useHandleError(error.value);
    state.value.data = data.value;
    state.value.loading = false;
    return data;
  };

  return {
    fetchProductReviews,
    ...toRefs(state.value),
  };
};