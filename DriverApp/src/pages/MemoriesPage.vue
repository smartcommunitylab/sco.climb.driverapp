<script setup lang="ts">
import { IonItem, IonList } from '@ionic/vue';
import { onMounted, ref } from 'vue'
const count = ref(0)
onMounted
</script>

<template>
      <base-layout page-title="All Memories">
      <IonList>
                <IonItem>
                    <button @click="count++">Count is: {{ count }}</button>

                </IonItem>
                <IonItem>
                    <button @click="count++">Count is: {{ count }}</button>

                </IonItem>
                <IonItem>
                    <button @click="count++">Count is: {{ count }}</button>

                </IonItem>
            </IonList>
</base-layout>

</template>

<style scoped>
button {
  font-weight: bold;
  width: 100px;
  height: 100px;
}
ion-toolbar {
    --background: var(--ion-color-primary);
}
ion-title {
    /* background-color: red; */
}
</style>