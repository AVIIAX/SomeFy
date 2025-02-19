<script setup>
import { ref, computed, onMounted } from 'vue';
import { DotLottieVue } from '@lottiefiles/dotlottie-vue';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import CircleMultiple from 'vue-material-design-icons/CircleMultiple.vue';

// Initialize Firestore
const db = getFirestore();

// Minimum quantity can be adjusted here
const minQuantity = 2;

const quantity = ref(minQuantity);
const pricePerCredit = ref(0);

// Live total calculation (formatted to 2 decimal places)
const totalPrice = computed(() => (pricePerCredit.value * quantity.value).toFixed(2));

// Retrieve price per credit from Firestore (doc: "shop/prices", field: credit)
onMounted(() => {
  const docRef = doc(db, 'shop', 'prices');
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.credit !== undefined) {
        pricePerCredit.value = data.credit;
      }
    }
  });
});

function increaseQuantity() {
  quantity.value++;
}

function decreaseQuantity() {
  if (quantity.value > minQuantity) {
    quantity.value--;
  }
}

function onBuy() {
  console.log(`Buying ${quantity.value} credits for $${totalPrice.value}`);
}
</script>

<template>
  <div class="shop-card">
    <div class="flex gap-3 justify-center items-center justify-items-center"><h2>Buy Credits</h2><CircleMultiple fillColor="#FFFFFF" :size="30"/></div>
    <DotLottieVue
      class="lottie"
      autoplay
      loop
      src="https://assets-v2.lottiefiles.com/a/ce38d508-f56c-11ee-9b29-f770b8fcb8fb/5hrf3OpgXE.lottie"
    />
    <div class="quantity-control">
      <button class="quantity-btn" @click="decreaseQuantity">-</button>
      <input
        type="number"
        v-model.number="quantity"
        :min="minQuantity"
      />
      <button class="quantity-btn" @click="increaseQuantity">+</button>
    </div>
    <div class="total-price">
      Total: ${{ totalPrice }}
    </div>
    <button class="buy-btn" @click="onBuy">Buy</button>
  </div>
</template>

<style scoped>
* {
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  letter-spacing: 2px;
}
h2 {
  color: #acacac;
  font-size: 25px;
}
.shop-card {
  background-color: #1f2225;
  color: #fff;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  width: 350px;
  margin: 2rem auto;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.lottie {
  height: 200px;
  width: 200px;
  margin: 0 auto 1rem;
}

.quantity-control {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
}

.quantity-btn {
  background: #2b6391;
  border: none;
  border-radius: 50%;
  color: #fff;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background 0.3s;
}

.quantity-btn:hover {
  background: #1976d2;
}

input[type="number"] {
  width: 60px;
  text-align: center;
  font-size: 1.2rem;
  padding: 0.5rem;
  border: 2px solid #2c5a80;
  border-radius: 8px;
  background: transparent;
  color: #fff;
  outline: none;
}

/* Remove default spinner arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.total-price {
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
}

.buy-btn {
  background: #385da1;
  border: none;
  border-radius: 8px;
  color: #fff;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.buy-btn:hover {
  background: #3b5179;
}
</style>
