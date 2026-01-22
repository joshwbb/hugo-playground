// 1. Import THREE + loader
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Global year update ---
const yearEl = document.getElementById('js-year');
if (yearEl) yearEl.innerHTML = new Date().getFullYear();

// --- Global Draco Setup ---
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/js/draco/gltf/');

const sharedGLTFLoader = new GLTFLoader();
sharedGLTFLoader.setDRACOLoader(dracoLoader);

// --- Three.js resize helper ---
window.__resizeThreeCard = function (container) {
  const canvas = container.querySelector('canvas');
  if (!canvas) return;
  const renderer = canvas.__threeRenderer;
  const camera = canvas.__threeCamera;
  if (!renderer || !camera) return;

  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) return;

  renderer.setSize(w, h, false);
  camera.aspect = w / h;

  // --- TARGETED SCALING ---
  const mobileWidth = 576; 
  const desktopWidth = 2175;
  
  const baseFOV = 35;
  const largeScreenFOV = 10; 

  if (w <= mobileWidth) {
    camera.fov = baseFOV;
  } else {
    const t = (w - mobileWidth) / (desktopWidth - mobileWidth);
    const easedT = Math.min(Math.max(t, 0), 1); 
    
    camera.fov = baseFOV - (easedT * (baseFOV - largeScreenFOV));
  }

  camera.updateProjectionMatrix();
};

function mountThreeScene(canvas) {
  console.log('🔧 mountThreeScene called');
  console.log('  Already mounted:', canvas.__threeMounted);
  console.log('  data-src:', canvas.dataset.src);
  
  if (canvas.__threeMounted) return;
  canvas.__threeMounted = true;

  const container =
    canvas.closest('.media-fill-container') ||
    canvas.closest('.carousel-slide') ||
    canvas.parentElement;

  console.log('  Container found:', !!container);
  console.log('  Container dimensions:', container.clientWidth, 'x', container.clientHeight);

  let model, mixer, action;
  const clock = new THREE.Clock();
  const scene = new THREE.Scene();

  scene.translateX(0);
  scene.translateY(-1.9);
  scene.translateZ(0);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 2, 9.25);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  canvas.__threeRenderer = renderer;
  canvas.__threeCamera = camera;

  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.6));

  let controls;
  if (canvas.closest('.carousel-slides')) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    console.log('  OrbitControls enabled');
  }

  console.log('📦 Loading GLB:', canvas.dataset.src);
  
  sharedGLTFLoader.load(
    canvas.dataset.src,
    (gltf) => {
      console.log('✅ GLB loaded successfully!');
      console.log('  Animations:', gltf.animations.length);
      
      model = gltf.scene;
      scene.add(model);

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat);
        action.play();
        action.setEffectiveWeight(0);
        console.log('  Animation ready');
      }
    },
    (progress) => {
      console.log('📊 Loading progress:', Math.round((progress.loaded / progress.total) * 100) + '%');
    },
    (error) => {
      console.error('❌ GLB load FAILED:', error);
      console.error('  Path:', canvas.dataset.src);
    }
  );

  const play = () => { if (action) { action.reset().fadeIn(0.3).play(); action.setEffectiveWeight(1); } };
  const stop = () => { if (action) action.fadeOut(0.3); };

  container.addEventListener('mouseenter', () => { if (window.innerWidth >= 768) play(); });
  container.addEventListener('mouseleave', () => { if (window.innerWidth >= 768) stop(); });

  let tapTime = 0;
  container.addEventListener('touchstart', () => { tapTime = Date.now(); });
  container.addEventListener('touchend', () => {
    if (Date.now() - tapTime < 200) {
      if (action && action.getEffectiveWeight() > 0.5) stop(); else play();
    }
  });

  let rafId;
  function animate() {
    rafId = requestAnimationFrame(animate);

    if (canvas.__isVisible === false) return;

    const delta = clock.getDelta();
    if (controls) controls.update();
    if (model && (!controls || !controls.active)) model.rotation.y += 0.002;
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
  }

  animate();

  canvas.__threeCleanup = () => {
    cancelAnimationFrame(rafId);
    renderer.dispose();
    scene.clear();
    canvas.__threeMounted = false;
    console.log('🧹 Three.js scene cleaned up');
  };
}

function cleanupThreeScenes(root) {
  root.querySelectorAll('.threejs-scene').forEach(canvas => {
    if (canvas.__threeCleanup) canvas.__threeCleanup();
  });
}

document.addEventListener('DOMContentLoaded', () => {
// --- 1. MASONRY SHUFFLE + CHIP INJECTION ---
const masonry = document.querySelector('.masonry');
const chipPool = document.querySelector('.chip-pool');

console.log('🔍 Masonry found:', !!masonry);
console.log('🔍 Chip pool found:', !!chipPool);

if (masonry) {
  const allItems = Array.from(masonry.children);
  const projectCards = allItems.filter(item => !item.classList.contains('info-chip-item'));
  
  for (let i = projectCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [projectCards[i], projectCards[j]] = [projectCards[j], projectCards[i]];
  }
  
  masonry.innerHTML = '';
  projectCards.forEach(card => masonry.appendChild(card));
  
if (chipPool) {
  const chips = Array.from(chipPool.querySelectorAll('.info-chip-item'));
  const themes = ['black-theme', 'grey-theme', 'blue-theme', 'white-theme', 'inverse-theme'];
  
  for (let i = chips.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chips[i], chips[j]] = [chips[j], chips[i]];
  }

  chips.forEach((chip, idx) => {
    const link = chip.querySelector('.grid-item');
    if (link) {
      link.classList.remove('black-theme', 'grey-theme', 'blue-theme', 'white-theme', 'inverse-theme');
      link.classList.add(themes[idx % themes.length]);
    }
  });
  
  console.log('🎲 Shuffled chip order:', chips.map(c => c.dataset.chipType));
  
  const totalCards = projectCards.length;
  const numChips = chips.length;
  
  const allPositions = Array.from({ length: totalCards + 1 }, (_, i) => i);
  
  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }
  
  const chipPositions = allPositions.slice(0, numChips);
  chipPositions.sort((a, b) => b - a);
  
  chipPositions.forEach((position, idx) => {
    const chip = chips[idx];
    if (chip) {
      if (position === 0) {
        masonry.insertBefore(chip, masonry.firstChild);
      } else {
        const targetCard = masonry.children[position - 1];
        if (targetCard) {
          targetCard.insertAdjacentElement('afterend', chip);
        } else {
          masonry.appendChild(chip);
        }
      }
    }
  });
  
  chipPool.remove();
}
  
  console.log('Total items:', masonry.children.length);
  console.log('Project cards:', masonry.querySelectorAll('.masonry-item:not(.info-chip-item)').length);
  console.log('Chips:', masonry.querySelectorAll('.info-chip-item').length);
}

  // --- 2. INTERNAL MEDIA SHUFFLE ---
  document.querySelectorAll('.image-card').forEach(card => {
    const poolData = card.dataset.pool;
    if (!poolData) return;

    const rawPool = poolData.split('|').filter(src => {
      const isManualExclude = src.startsWith('!');
      return src.length > 0 && !isManualExclude;
    });

    if (rawPool.length > 0) {
      const randomMedia = rawPool[Math.floor(Math.random() * rawPool.length)];
      const isVideo = randomMedia.match(/\.(mp4|webm|mov)$/i);

      if (isVideo) {
        const mainVideo = card.querySelector('video.card-main-media');
        const mainImg = card.querySelector('img.card-main-media');

        if (mainImg) {
          const video = document.createElement('video');
          video.className = 'card-main-media';
          video.src = randomMedia;
          video.autoplay = true;
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          mainImg.replaceWith(video);
        } else if (mainVideo) {
          mainVideo.src = randomMedia;
        }
      } else {
        const mainImg = card.querySelector('img.card-main-media');
        const mainVideo = card.querySelector('video.card-main-media');

        if (mainVideo) {
          const img = document.createElement('img');
          img.className = 'card-main-media';
          img.src = randomMedia;
          img.alt = '';
          mainVideo.replaceWith(img);
        } else if (mainImg) {
          mainImg.src = randomMedia;
        }
      }
    }
  });

  // --- 3. Overlay / Hash Logic ---
  let lastScrollY = 0;
  
  function showProjectByHash() {
    const id = location.hash.replace('#', '');
    console.log('🔍 showProjectByHash called, id:', id);
    if (!id) {
      document.querySelectorAll('.project-page').forEach(p => p.classList.remove('is-active'));
      document.body.style.overflow = '';
      document.body.classList.remove('project-open');
      return;
    }
    const targetPage = document.getElementById(id);
    console.log('🔍 Target page found:', !!targetPage);
    if (targetPage) {
      lastScrollY = window.scrollY;
      document.body.classList.add('project-open');
      targetPage.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          initCarousel(targetPage);
          
          const resizeAll = () => {
            targetPage.querySelectorAll('.threejs-scene').forEach(canvas => {
              if (canvas.__threeRenderer) {
                const container = canvas.parentElement;
                const w = container.clientWidth;
                const h = container.clientHeight;
                if (w > 0 && h > 0) {
                  canvas.__threeRenderer.setSize(w, h, false);
                  canvas.__threeCamera.aspect = w / h;
                  canvas.__threeCamera.updateProjectionMatrix();
                }
              }
            });
          };
          resizeAll();
          setTimeout(resizeAll, 100);
          setTimeout(resizeAll, 500);
        });
      });
    }
  }
  
  showProjectByHash();
  window.addEventListener('hashchange', showProjectByHash);

  function initCarousel(projectPage) {
    const container = projectPage.querySelector('.carousel-container');
    
    console.log('🎯 initCarousel called');
    
    if (!container || container.dataset.ready) return;
    container.dataset.ready = 'true';

    const slides = container.querySelector('.carousel-slides');
    
    const slideElements = Array.from(slides.children).filter(slide => {
      const img = slide.querySelector('img');
      if (img && img.src.includes('_thumb')) {
        slide.remove();
        return false;
      }
      return true;
    });
    
    const slideCount = slideElements.length;
    console.log('  Total slides:', slideCount);
    
    if (slideCount === 0) return;
    
    let index = 0;

    const firstSlide = slideElements[0];
    if (firstSlide) {
      firstSlide.__isVisible = true;
      firstSlide.querySelectorAll('.threejs-scene').forEach(canvas => {
        canvas.__isVisible = true;
        console.log('🚀 Force mounting first slide GLB');
        mountThreeScene(canvas);
      });
    }

    const slideObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const slide = entry.target;
          
          if (slide === firstSlide && !entry.isIntersecting) {
            slide.__isVisible = false;
            slide.querySelectorAll('.threejs-scene').forEach(canvas => {
              canvas.__isVisible = false;
              if (canvas.__threeCleanup) {
                canvas.__threeCleanup();
              }
            });
            return;
          }
          
          slide.__isVisible = entry.isIntersecting;

          slide.querySelectorAll('.threejs-scene').forEach(canvas => {
            canvas.__isVisible = entry.isIntersecting;
            
            console.log('👁️ Canvas visibility changed:', {
              visible: entry.isIntersecting,
              src: canvas.dataset.src
            });

            if (entry.isIntersecting) {
              mountThreeScene(canvas);
            } else if (canvas.__threeCleanup) {
              canvas.__threeCleanup();
            }
          });
        });
      },
      {
        root: container,
        threshold: 0.6
      }
    );

    slideElements.forEach(slide => {
      slideObserver.observe(slide);
    });

    // --- ADD HOLD-TO-PAUSE FOR CAROUSEL WEBM VIDEOS ---
    console.log('🎥 Setting up hold-to-pause for carousel videos');
    console.log('  Total slides:', slideElements.length);
    
    slideElements.forEach((slide, slideIdx) => {
      const videos = slide.querySelectorAll('video');
      console.log(`  Slide ${slideIdx}: found ${videos.length} video(s)`);
      
      videos.forEach((videoElement, vidIdx) => {
        console.log(`    Video ${vidIdx} src:`, videoElement.src);
        console.log(`    Is webm:`, videoElement.src.match(/\.webm$/i));
        
        if (!videoElement.src.match(/\.webm$/i)) {
          console.log(`    ⏭️ Skipping (not webm)`);
          return;
        }

        console.log(`    ✅ Adding hold-to-pause listeners`);
        let isPausedByHold = false;

        const startHold = (e) => {
          console.log('🖱️ HOLD START:', e.type);
          if (e.type === 'touchstart') e.preventDefault(); 
          
          if (!videoElement.paused) {
            console.log('  ⏸️ Pausing video');
            videoElement.pause();
            isPausedByHold = true;
          } else {
            console.log('  Already paused');
          }
        };

        const endHold = () => {
          console.log('🖱️ HOLD END');
          if (isPausedByHold) {
            console.log('  ▶️ Resuming video');
            videoElement.play().catch(() => {});
            isPausedByHold = false;
          }
        };

        videoElement.addEventListener('mousedown', startHold);
        videoElement.addEventListener('mouseup', endHold);
        videoElement.addEventListener('mouseleave', endHold);

        videoElement.addEventListener('touchstart', startHold, { passive: false });
        videoElement.addEventListener('touchend', endHold);
        videoElement.addEventListener('touchcancel', endHold);
        
        console.log('    ✔️ Listeners attached');
      });
    });

    const update = () => {
      slides.style.transform = `translateX(-${index * 100}%)`;

      slideElements.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add('is-active');
        } else {
          slide.classList.remove('is-active');
        }
      });

      console.log(`📍 Carousel at slide ${index + 1}/${slideCount}`);
    };

    const goNext = () => { 
      console.log('➡️ Next clicked');
      index = (index + 1) % slideCount; 
      update(); 
    };
    
    const goPrev = () => { 
      console.log('⬅️ Prev clicked');
      index = (index - 1 + slideCount) % slideCount; 
      update(); 
    };

    const leftArrow = container.querySelector('.carousel-arrow.left');
    const rightArrow = container.querySelector('.carousel-arrow.right');

    if (leftArrow) {
      leftArrow.addEventListener('click', (e) => {
        console.log('🖱️ Left arrow CLICKED');
        e.preventDefault();
        e.stopPropagation();
        goPrev();
      });
    }
    
    if (rightArrow) {
      rightArrow.addEventListener('click', (e) => {
        console.log('🖱️ Right arrow CLICKED');
        e.preventDefault();
        e.stopPropagation();
        goNext();
      });
    }

    if (window.matchMedia('(pointer: coarse)').matches) {
      let startX = 0;
      let startY = 0;
      const threshold = 30;

      container.addEventListener('touchstart', e => {
        const currentSlide = slideElements[index];
        const type = currentSlide ? currentSlide.getAttribute('data-media-type') : null;

        const isForbidden = e.target.closest('.threejs-scene, canvas, iframe, .active-facade-iframe, .info-tab, .info-button, .info-content, .project-close, .carousel-arrow');
        if (isForbidden || type === "glb" || type === "youtube") {
          startX = 0;
          return;
        }

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });

      container.addEventListener('touchmove', e => {
        if (startX === 0) return;
        
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;

        if (Math.abs(dx) > Math.abs(dy)) {
          if (e.cancelable) e.preventDefault();
        }
      }, { passive: false });

      container.addEventListener('touchend', e => {
        if (startX === 0) return;

        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
          if (dx < 0) {
            index = (index + 1) % slideCount;
          } else {
            index = (index - 1 + slideCount) % slideCount;
          }
          update();
        }
        
        startX = 0;
      }, { passive: true });
    }
    
    update();
  }

  // --- 4. Closing Logic ---
  function closeProject() {
    const activePage = document.querySelector('.project-page.is-active');
    history.replaceState(null, null, ' ');
    document.body.classList.remove('project-open');
    document.body.style.overflow = '';

    if (activePage) {
      activePage.classList.remove('is-active');

      activePage.querySelectorAll('.video-facade').forEach(facade => {
        const videoId = facade.dataset.videoid;
        facade.innerHTML = `
          <img src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg" loading="lazy">
          <div class="play-button"></div>
        `;
      });

      activePage.querySelectorAll('iframe:not(.active-facade-iframe)').forEach(i => {
        const s = i.src; i.src = ''; i.src = s;
      });
      activePage.querySelectorAll('video').forEach(v => {
        v.pause(); v.currentTime = 0;
      });
    }
    window.scrollTo(0, lastScrollY);
    
    activePage.querySelectorAll('.info-tab').forEach(tab => {
      const btn = tab.querySelector('.info-button');
      const content = tab.querySelector('.info-content');

      btn.setAttribute('aria-expanded', 'false');
      content.style.display = 'none';
    });

    activePage.querySelectorAll('.threejs-scene').forEach(canvas => {
      if (canvas.__rafId) canvas.__rafId();
      if (canvas.__threeRenderer) {
        canvas.__threeRenderer.dispose();
      }
    });
    cleanupThreeScenes(activePage);
  }
  
  document.querySelectorAll('.project-close').forEach(btn => btn.addEventListener('click', closeProject));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProject();
    }

    const activePage = document.querySelector('.project-page.is-active');
    if (!activePage) return;

    const key = e.key.toLowerCase();

    if (key === 'i') {
      const infoBtn = activePage.querySelector('.info-button');
      if (infoBtn) infoBtn.click();
    }

    if (key === 'f') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn(`Fullscreen error: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }

    if (e.key === 'ArrowRight') {
      const nextBtn = activePage.querySelector('.carousel-arrow.right');
      if (nextBtn) nextBtn.click();
    } 
    
    if (e.key === 'ArrowLeft') {
      const prevBtn = activePage.querySelector('.carousel-arrow.left');
      if (prevBtn) prevBtn.click();
    }
  });

  // --- 5. Info tabs ---
  document.querySelectorAll('.info-tab').forEach(tab => {
    const btn = tab.querySelector('.info-button');
    const content = tab.querySelector('.info-content');

    function toggleInfo() {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !expanded);
      content.style.display = expanded ? 'none' : 'block';
    }

    btn.addEventListener('click', toggleInfo);
    content.addEventListener('click', () => {
      if (btn.getAttribute('aria-expanded') === 'true') toggleInfo();
    });
  });

  // --- 6. Three.js Logic (GLB Cards / MASONRY) ---
  document.querySelectorAll('.three-card').forEach(container => {
    let model, mixer, action, isPaused = true;
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 1.5, -3.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    container.appendChild(renderer.domElement);

    renderer.domElement.__threeRenderer = renderer;
    renderer.domElement.__threeCamera = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.6));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (window.innerWidth < 768) {
          if (entry.isIntersecting) {
            isPaused = false;
            if (action) {
              action.enabled = true;
              action.setEffectiveWeight(1);
              action.play();
            }
          } else {
            if (action) action.fadeOut(0.5);
            isPaused = true;
          }
        } else {
          isPaused = !entry.isIntersecting;
        }
      });
    }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
    observer.observe(container);

    sharedGLTFLoader.load(container.dataset.model, (gltf) => {
      model = gltf.scene;
      scene.add(model);
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat);
        action.play();
        action.setEffectiveWeight(0);
      }
    });

    const hoverTarget = container.closest('.image-card') || container;
    hoverTarget.addEventListener('mouseenter', () => {
      if (window.innerWidth >= 768) {
        isPaused = false;
        if (action) action.reset().enabled = true;
        if (action) action.setEffectiveWeight(1).fadeIn(0.3).play();
      }
    });
    hoverTarget.addEventListener('mouseleave', () => {
      if (window.innerWidth >= 768 && action) action.fadeOut(0.3);
    });

    let rafId;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (model) model.rotation.y += 0.002;
      if (mixer) mixer.update(delta);
      renderer.render(scene, camera);
    }

    animate();
    renderer.domElement.__rafId = () => cancelAnimationFrame(rafId);
  });

  // --- YouTube Facade Activation ---
  document.addEventListener('click', (e) => {
    const facade = e.target.closest('.video-facade');
    if (facade) {
      const videoId = facade.dataset.videoid;
      facade.innerHTML = `
        <iframe 
          src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0" 
          allow="autoplay; encrypted-media; allowfullscreen" 
          class="active-facade-iframe">
        </iframe>`;
    }
  });

  // Global listener for all masonry-item clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').substring(1);
    const targetOverlay = document.getElementById(targetId);

    if (targetOverlay) {
      e.preventDefault();
      history.pushState(null, null, `#${targetId}`);
      showProjectByHash();
    }
  });

});