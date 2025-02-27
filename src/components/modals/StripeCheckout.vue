<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-btn" @click="closeModal">&times;</button>
      <h2>Checkout for {{ item }}</h2>
      <p>Amount: ${{ price }}</p>
      <!-- Only render the form when Stripe is loaded and a client secret is available -->
      <form v-if="stripeLoaded && clientSecret" @submit.prevent="handleSubmit">
        <StripeElements class="ff"
          :stripe-key="stripeKey"
          :instance-options="stripeOptions"
          :elements-options="elementsOptions"
          ref="elementsComponent"
        >
          <StripeElement class="gg"
            type="payment"
            :options="paymentElementOptions"
            ref="paymentComponent"
          />
        </StripeElements>
        <button type="submit">Submit Payment</button>
      </form>
      <div v-else>Loading Payment Element...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { StripeElements, StripeElement } from 'vue-stripe-js';
import stripePromise from '../../stripe'; // Ensure this is a singleton instance
import { useModalStore } from '../../stores/modalStore.js';
const modalStore = useModalStore();

const item = ref("Test Item");
const price = ref(9.99);

const stripeKey = 'pk_test_51Qk8TQBZZyFOcsgGsmhWji0pGNkodneInvB9lGBLtgrLuEhvl8eSrGTcCHBmyUWjoqxT86vbrlxLC6IBGtSba8xn000DRZM10Q'; // Replace with your key
const clientSecret = ref('pi_3Qwq03BZZyFOcsgG0fp2wku1_secret_FPlSeguJ5VS8CjrnOAatehssT'); // Replace with your real client secret

const stripeOptions = ref({});
const elementsOptions = ref({
  appearance: { theme: 'flat' },
  clientSecret: clientSecret.value
});
const paymentElementOptions = ref({});

const stripeLoaded = ref(false);
const stripe = ref<any>(null);
const elementsComponent = ref<any>(null);

onBeforeMount(async () => {
  // Ensure the Stripe instance is only initialized once
  stripe.value = await stripePromise; 

  if (stripe.value) {
    stripeLoaded.value = true;
  }
});

async function handleSubmit(event) {
  event.preventDefault();

  if (!stripe.value) {
    console.error("Stripe is not loaded");
    return;
  }

  // Use the same Stripe instance for Elements and payment confirmation
  const elements = elementsComponent.value?.elements;
  if (!elements) {
    console.error("Stripe Elements is not available");
    return;
  }

  // Ensure the same Stripe instance is used for submission and confirmation
  const { error: submitError } = await elements.submit();
  if (submitError) {
    console.error(submitError);
    return;
  }

  const { error, paymentIntent } = await stripe.value.confirmPayment({
    elements,
    confirmParams: {
      return_url: "https://your-site.com/checkout-success",
    },
  });

  if (error) {
    console.error(error.message);
  } else {
    console.log("Payment successful:", paymentIntent);
  }
}

const closeModal = () => {
  modalStore.toggleModal('StripeCheckout'); // Close modal
};
</script>



<style scoped>
.modal-container {
  color: azure;
  display: flex;
  flex-direction: column;
}
h1 {
  font-weight: 700;
}

.svg {
  display: inline;
}

.level {
  display: inline;
  font-weight: 600;
  font-size: 40px;
  color: aqua;
}

.boostThis{
  transition: all 0.5s;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.boostThis:hover, .boostThisFailed:hover {
  transform: scale(1.05);
  gap: 1rem;
}

.boostThisFailed {
  transition: all 0.5s;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background-image: none;
  background-color: rgba(212, 31, 31, 0.856) !important;
  box-shadow: none;
}

.ff {
  color: azure;
}

.gg {
  color: azure;
}
</style>
