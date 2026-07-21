/**
 * Custom Feature Cards
 *
 * Handles:
 * - Vue rendering from Shopify section data
 * - Card click interactions
 * - Popup creation
 * - Image expansion animation
 * - Content reveal animation
 * - Popup close animation
 */
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.querySelector('.feature-popup-overlay');
  const sectionContent = document.querySelectorAll('.custom-feature-section__top, .feature-card-list');

  const cardsDataElement = document.getElementById('custom-feature-cards-data');
  const parsedCardsData = cardsDataElement ? JSON.parse(cardsDataElement.textContent || '{}') : {};
  const initialCards = Array.isArray(parsedCardsData.cards) ? parsedCardsData.cards : [];

  if (window.Vue) {
    const { createApp, ref } = Vue;

    const FeatureCard = {
      props: {
        card: {
          type: Object,
          required: true
        }
      },
      template: `
        <div class="feature-card" data-card>
          <div
            class="feature-card__image"
            data-image
            :data-image-url="card.popupImage || card.cardImage"
            :style="card.cardImage ? 'background-image:url(' + card.cardImage + ')' : ''"
          ></div>

          <div class="feature-card__content">
            <span class="feature-card__title">{{ card.title }}</span>
            <span class="feature-card__subtitle">{{ card.subtitle }}</span>
          </div>

          <div class="card-popup-template" style="display:none">
            <div class="popup-layout">
              <div class="popup-layout__image">
                <img v-if="card.popupImage" :src="card.popupImage" :alt="card.title" loading="lazy">
              </div>

              <div class="popup-layout__content">
                <div class="popup-heading">
                  <h3>{{ card.title }}</h3>
                  <span>{{ card.subtitle }}</span>
                </div>

                <div class="popup-description" v-html="card.description"></div>

                <button type="button" class="popup-close">
                  {{ card.buttonText || 'Go Back' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      `
    };

    const FeatureCardsApp = {
      components: {
        FeatureCard
      },
      setup() {
        const cards = ref(initialCards);

        return {
          cards
        };
      },
      template: `
        <template v-for="card in cards" :key="card.id">
          <FeatureCard :card="card" />
        </template>
      `
    };

    document.querySelectorAll('[data-vue-feature-cards-root]').forEach((root) => {
      createApp(FeatureCardsApp).mount(root);
    });
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-card]');

    if (!card) return;

    const image = card.querySelector('[data-image]');
    const imageUrl = image?.dataset.imageUrl;

    if (!imageUrl) return;

    const template = card.querySelector('.card-popup-template');
    const popupContent = template?.querySelector('.popup-layout__content')?.outerHTML || '';

    const imageClone = document.createElement('div');
    imageClone.classList.add('popup-image-clone');
    imageClone.style.backgroundImage = `url(${imageUrl})`;

    const rect = image.getBoundingClientRect();

    overlay.innerHTML = `
      <div class="popup-layout">
        <div class="popup-layout__image"></div>
        ${popupContent}
      </div>
    `;

    overlay.classList.add('active');

    gsap.to(sectionContent, {
      opacity: 0,
      duration: 0.3,
      ease: 'none'
    });

    gsap.set(imageClone, {
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 10001
    });

    document.body.appendChild(imageClone);

    const targetContainer = overlay.querySelector('.popup-layout__image');
    const targetRect = targetContainer.getBoundingClientRect();

    gsap.to(imageClone, {
      top: targetRect.top,
      left: targetRect.left,
      width: targetRect.width,
      height: targetRect.height,
      duration: 0.8,
      ease: 'power3.inOut',
      onComplete() {
        targetContainer.innerHTML = `
          <img
            src="${imageUrl}"
            alt=""
            loading="lazy"
          >
        `;
        imageClone.remove();
      }
    });

    gsap.set(['.popup-heading', '.popup-description', '.popup-close'], {
      opacity: 0,
      y: 30
    });

    const tl = gsap.timeline({
      delay: 0.8
    });

    tl.to('.popup-heading', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    });

    tl.to('.popup-description', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.2');

    tl.to('.popup-close', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.2');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.popup-close')) return;

    gsap.to(['.popup-heading', '.popup-description', '.popup-close'], {
      opacity: 0,
      y: 30,
      duration: 0.3
    });

    gsap.to(overlay, {
      opacity: 0,
      duration: 0.4,
      onComplete() {
        overlay.innerHTML = '';
        overlay.classList.remove('active');
        overlay.style.opacity = '';

        gsap.to(sectionContent, {
          opacity: 1,
          duration: 0.3
        });
      }
    });
  });
});
