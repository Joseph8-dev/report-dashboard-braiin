<template>
  <div class="notranslate" translate="no">
    <div class="profile-dropdown-wrapper">
      <VaDropdown
        v-model="isShown"
        :offset="[9, 0]"
        class="profile-dropdown notranslate"
        stick-to-edges
        translate="no"
      >
        <template #anchor>
          <VaButton preset="secondary" color="textPrimary" class="notranslate" translate="no">
            <span class="profile-dropdown__anchor min-w-max notranslate" translate="no">
              {{ text_admin }}
              <VaAvatar :size="32" color="warning" class="notranslate" translate="no"> 🧑‍💻 </VaAvatar>
            </span>
          </VaButton>
        </template>

        <VaDropdownContent
          class="profile-dropdown__content md:w-60 px-0 py-4 w-full notranslate"
          :style="{ '--hover-color': hoverColor }"
          translate="no"
        >
          <VaList class="notranslate" translate="no">
            <VaListItem
              class="menu-item px-4 text-base cursor-pointer h-8 flex items-center gap-2 notranslate"
              @click="logout"
              translate="no"
            >
              <!-- Icon -->
              <span class="notranslate" translate="no">
                <VaIcon :name="iconLogout" class="pr-1" color="secondary" />
              </span>

              <!-- Text -->
              <span class="notranslate" translate="no">
                {{ text_logout }}
              </span>
            </VaListItem>
          </VaList>
        </VaDropdownContent>
      </VaDropdown>
    </div>
  </div>
</template>


<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useColors } from 'vuestic-ui'
import { VaDropdown, VaDropdownContent, VaList, VaListItem, VaButton, VaAvatar, VaIcon } from 'vuestic-ui'

const router = useRouter()
const { t } = useI18n()
const { colors, setHSLAColor } = useColors()
const hoverColor = computed(() => setHSLAColor(colors.focus, { a: 0.1 }))

const isShown = ref(false)
const iconLogout = 'mso-' + 'logout'
const text_admin = 'Admin'
const text_logout = 'Cerrar sesión'

const logout = () => {
  localStorage.removeItem('report_token')
  localStorage.removeItem('report_user')
  sessionStorage.clear()
  router.push({ name: 'login' })
}
</script>

<style lang="scss" scoped>
.profile-dropdown {
  cursor: pointer;

  &__content {
    .menu-item:hover {
      background: var(--hover-color);
    }
  }

  &__anchor {
    display: inline-block;
  }

  .logout-text {
    display: inline-block;  /* Treat text as a separate block */
    white-space: nowrap;    /* Prevent Chrome Translate from breaking */
  }
}
</style>
