<template>
    <NuxtRouteAnnouncer />
    <NuxtPage />
</template>

<style lang="css">
@import "tailwindcss";
@import "@nuxt/ui";

html {
    width: 100%;
    height: 100%;
    min-height: 100vh;
    background-color: #181414;
    color: white;
}

body {
    width: 100%;
    height: 100%;
    font-family: Arial, Helvetica, sans-serif;
    padding: 0;
    margin: 0;
}

#__nuxt {
    width: 100%;
    height: 100%;
}
</style>
