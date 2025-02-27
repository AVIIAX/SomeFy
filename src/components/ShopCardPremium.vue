<script setup>
import { ref, computed, onMounted } from 'vue';
import { DotLottieVue } from '@lottiefiles/dotlottie-vue';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import Knight from 'vue-material-design-icons/ChessKnight.vue';
import Check from 'vue-material-design-icons/Check.vue';
import ChevronUp from 'vue-material-design-icons/ChevronUp.vue';
import ChevronDown from 'vue-material-design-icons/ChevronDown.vue';

// Initialize Firestore
const db = getFirestore();

// State
const plan = ref('monthly'); // can be 'monthly' or 'annually'
const prices = ref({ premiumMonth: 0, premiumYear: 0 });
const featuresOpen = ref(false);
const premiumFeatures = [
  'Ad-free Experience',
  '25 Credits Monthly',
  'Extended Music Player',
  'Custom Profile URL'
];

// Listen for price updates from Firestore
onMounted(() => {
  const docRef = doc(db, 'shop', 'prices');
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      prices.value = docSnap.data();
    }
  });
});

// Computed property for the current price based on selected plan
const price = computed(() => {
  return plan.value === 'monthly'
    ? prices.value.premiumMonth
    : prices.value.premiumYear;
});

// Switch plan to monthly
const setMonthly = () => {
  plan.value = 'monthly';
};

// Switch plan to annually
const setAnnually = () => {
  plan.value = 'annually';
};

// Log the chosen plan and price when the Buy button is clicked
const onBuy = () => {
  console.log(
    `Buying premium ${plan.value === 'monthly' ? 'Monthly' : 'Annually'} Plan for $${price.value}`
  );
};

// Toggle the “Why PRO?” dropdown
const toggleFeatures = () => {
  featuresOpen.value = !featuresOpen.value;
};
</script>

<template>
  <div class="shop-card">
    <!-- Header -->
    <div class="header flex gap-3 justify-center items-center">
      <h2>Buy Premium</h2>
      <Knight fillColor="#FFFFFF" :size="30" />
    </div>

    <!-- Lottie Animation -->
    <DotLottieVue
      class="lottie"
      autoplay
      loop
      src="https://assets-v2.lottiefiles.com/a/5a022e76-117b-11ee-88ed-e7a134fba5cb/aQXIz0BRr4.lottie"
    />

    <!-- Modern Toggle -->
    <div class="modern-toggle">
      <div
        :class="['toggle-option', { active: plan === 'monthly' }]"
        @click="setMonthly"
      >
        MONTHLY
      </div>
      <div
        :class="['toggle-option', { active: plan === 'annually' }]"
        @click="setAnnually"
      >
        ANNUALLY
      </div>
    </div>

    <!-- Dropdown: Why PRO? -->
        <div class="dropdown">
          <div class="dropdown-header" @click="toggleFeatures">
            <h3>Why PRO?</h3>
            
            <ChevronUp v-if="featuresOpen" fillColor="WHITE" />
            <ChevronDown v-else fillColor="WHITE" />
          </div>
          <transition name="fade">
            <ul v-if="featuresOpen" class="dropdown-content">
              <li v-for="(feature, index) in premiumFeatures" :key="index">
                <Check fillColor="WHITE" /> {{ feature }}
              </li>
            </ul>
          </transition>
        </div>

    <!-- Price & Buy Button -->
    <div class="total-price">${{ price }}<span class="text-gray-500">/{{ plan === 'monthly' ? 'Month' : 'Year' }}</span>
    </div>
    <button class="minimal-btn" @click="onBuy">Buy</button>

    
  </div>
</template>

<style scoped>
.shop-card {
  background-color: #1f2225;
  color: #fff;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  width: 350px;
  margin: 2rem auto;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.header h2 {
  color: #acacac;
  font-size: 25px;
}

.lottie {
  height: 200px;
  width: 200px;
  margin: 0 auto 1rem;
}

/* Modern two-tab toggle */
.modern-toggle {
  display: flex;
  border: 1px solid #fff;
  border-radius: 4px;
  overflow: hidden;
  margin: 1.5rem auto;
  width: 250px; /* Adjust width as needed */
}

.toggle-option {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
  font-size: 14px;
  letter-spacing: 1px;
}

.toggle-option.active {
  background-color: #fff;
  color: #000;
}

.total-price {
  font-size: 1.3rem;
  margin-top: 1rem;
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

/* Dropdown: Why PRO? */
.dropdown {
  margin-top: 20px;
  text-align: left;
  border-radius: 8px;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-top: 1px solid #444;
  border-bottom: 1px solid #444;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 16px;
  color: #fff;
}

.dropdown-header span {
  font-size: 16px;
  color: #fff;
}

.dropdown-content {
  list-style: none;
  padding: 10px;
  margin: 0;
}

.dropdown-content li {
  padding: 5px 0;
  border-bottom: 1px solid #444;
  font-size: 14px;
  color: #ccc;
  display: flex;
  gap: 1rem;
}

.dropdown-content li:last-child {
  border-bottom: none;
}

/* Simple fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
