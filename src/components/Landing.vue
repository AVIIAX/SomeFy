<template>
  <div class="gradient">
    <div class="gradient-1"></div>
    <div class="gradient-2"></div>
  </div>

  <div class="main-container">
    <div class="flex flex-col items-center justify-center p-20 z-50 top-0 left-0 h-full">
      <div class="flex">
        <img src="../assets/logo-big.svg" width="600" alt="Logo">
      </div>
      <div class="tagline">
        <span>Share, Stream, Collab</span>
      </div>
      <div class="auth-btns">
        <div @click="$emit('switch-to-login')">Login</div>
        <div @click="$emit('switchToRegister')">JOIN</div>
      </div>

      <div class="feature-container">
        <div class="feature">
          <h1>SHARE</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.</p>
        </div>
        <div class="feature">
          <h1>STREAM</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.</p>
        </div>
        <div class="feature">
          <h1>COLLAB</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No changes needed for the script
</script>

<style scoped>
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.gradient {
  position: absolute;
  width: 100%;
  height: 100%;
  --speed: 20s;
  --easing: cubic-bezier(0.8, 0.2, 0.2, 0.8);
  animation: rotate var(--speed) var(--easing) alternate infinite;
}

.gradient-1 {
  --size: 750px;
  --speed: 20s;
  --easing: cubic-bezier(0.8, 0.2, 0.2, 0.8);
  width: var(--size);
  height: var(--size);
  filter: blur(calc(var(--size) / 5));
  background-image: linear-gradient(#4377ef, #7befd0);
  animation: rotate var(--speed) var(--easing) alternate infinite;
  border-radius: 30% 70% 70% 30%/30% 30% 70% 70%;
  top: 50%;
  left: 50%;
  opacity: 20%;
}

.gradient-2 {
  --size: 500px;
  --speed: 20s;
  --easing: cubic-bezier(0.8, 0.2, 0.2, 0.8);
  width: var(--size);
  height: var(--size);
  filter: blur(calc(var(--size) / 5));
  background-image: linear-gradient(#ef4343, #ef927b);
  animation: rotate var(--speed) var(--easing) alternate infinite;
  border-radius: 30% 70% 70% 30%/30% 30% 70% 70%;
  opacity: 20%;
}

@media (min-width: 720px) {
  .gradient-1, .gradient-2 {
    --size: 500px;
  }
}

body {
  background-color: #071c39;
  position: absolute;
  inset: 0;
  display: flex;
  place-content: center;
  align-items: center;
  overflow: hidden;
}

* {
  transition: all 0.5s ease-out;
}

.main-container {
  position: relative;
  overflow-y: auto;
  max-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  width: 100%;
  border-radius: 20px;
  margin-top: 20px;
  z-index: 50;
}

.tagline {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin-top: 10px;
  text-align: center;
}

.auth-btns {
  display: flex;
  gap: 2rem;
  margin-top: 20px;
  justify-content: center;
}

.auth-btns>div {
  color: white;
  border: none;
  padding: 10px 20px;
  border: 2px solid #e0e0e0ea;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  word-spacing: 0.5rem;
  transition: all 0.3s;
}

.auth-btns>div:hover {
  background-color: #e0e0e041;
}

.auth-btns>div:nth-child(2) {
  background-color: #e0e0e0ea;
  color: black;
}

.auth-btns>div:nth-child(2):hover {
  background-color: #e0e0e041;
  color: white;
  border: 2px solid #e0e0e0ea;
}

.feature-container {
  display: flex;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  height: fit-content;
  margin-top: 65px;
  flex-wrap: wrap;
  justify-content: center;
}

.feature {
  width: 200px;
  background: rgb(38,36,70);
background: linear-gradient(90deg, rgba(38, 36, 70, 0.637) 0%, rgba(74, 44, 44, 0.596) 100%);
  padding: 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.6s ease-out;
  margin-bottom: 1rem;
  text-align: center;
}

.feature:hover {
  transform: scale(1.02);
}

.feature h1 {
  color: rgb(236, 236, 236);
  font-weight: bold;
  margin-bottom: 1rem;
}

.feature p {
  color: rgb(155, 155, 155);
}

/* width */
::-webkit-scrollbar, ::-webkit-scrollbar-track, ::-webkit-scrollbar-thumb{
  opacity: 0;
  display: none;
}

</style>
