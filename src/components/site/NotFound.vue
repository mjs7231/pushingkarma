<template>
  <div id='notfound'>
    <Navigation :cls="'topnav'" />
    <div class='content'>
      <div class='contentbg'>
        <div class='x404'>404</div>
        Page not found!
      </div>
      <Footer/>
    </div>
  </div>
</template>

<script>
  import Footer from '@/components/site/Footer';
  import Navigation from '@/components/site/Navigation';

  export default {
    name: 'NotFound',
    components: {Footer, Navigation},
  };
</script>

<style lang='scss'>
  #notfound .content {
    box-sizing: border-box;
    color: $lightbg-text;
    margin-top: 60px;
    font-family: $fontfamily-artsy;
    background-color: $lightbg-bg2;
    
    .contentbg {
      font-size: 2rem;
      font-weight: 500;
      height: calc(100vh - 360px);
      min-height: 500px;
      padding: 100px 0px;
      text-align: center;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
    }
    .x404 {
      font-size: 13rem;
      font-weight: 400;
      line-height: 200px;
    }
  }
</style>
