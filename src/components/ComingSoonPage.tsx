import { motion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type TouchEvent } from "react";
import douradoImage from "../dourado.jpeg";
import hannyaPrimaryImage from "../Hannya 1.jpeg";
import hannyaSecondaryImage from "../Hannya.jpeg";
import ryuImage from "../Ryu.jpeg";
import samuraiPrimaryImage from "../samurai.jpeg";
import samuraiSecondaryImage from "../samurai2.jpeg";
import { getRevealProps, getStaggerItemProps, getStaggerProps } from "../lib/scrollReveal";

type ArtworkImage = {
  height: number;
  src: string;
  width: number;
};

type Artwork = {
  description: string;
  images: ArtworkImage[];
  name: string;
  price: string;
  whatsappMessage: string;
};

type ArtworkMediaProps = {
  artwork: Artwork;
  index: number;
};

const WHATSAPP_NUMBER = "5511942521850";
const HOME_ARTWORKS_SECTION_HASH = "#quadros";

const ARTWORKS: Artwork[] = [
  {
    description:
      "Entre ondas turbulentas e nuvens carregadas, o dragão emerge como símbolo de força, sabedoria e transformação. Inspirada na estética oriental japonesa, a obra explora o contraste entre o vermelho e o negro, evocando a dualidade entre destruição e renascimento, caos e equilíbrio.",
    images: [{ height: 1280, src: ryuImage, width: 960 }],
    name: "Ryū — O Despertar do Dragão",
    price: "R$ 2.499,00",
    whatsappMessage:
      "Olá! Tenho interesse na obra Ryū — O Despertar do Dragão, no valor de R$ 2.499,00. Gostaria de saber mais sobre a disponibilidade.",
  },
  {
    description:
      "Uma interpretação autoral inspirada na máscara Hannya da tradição japonesa. Os chifres e as folhas vermelhas evocam emoções intensas, transformação e a dualidade entre força e fragilidade. Uma obra sobre as sombras da alma e aquilo que nos transforma.",
    images: [
      { height: 1600, src: hannyaPrimaryImage, width: 900 },
      { height: 1600, src: hannyaSecondaryImage, width: 900 },
    ],
    name: "Hannya — O Peso das Emoções",
    price: "R$ 449,00",
    whatsappMessage:
      "Olá! Tenho interesse na obra Hannya — O Peso das Emoções, no valor de R$ 449,00. Gostaria de saber mais sobre a disponibilidade.",
  },
  {
    description:
      "Uma pintura autoral que une a estética japonesa à personalidade felina, em uma composição que transmite força, serenidade e individualidade.",
    images: [
      { height: 1280, src: samuraiPrimaryImage, width: 720 },
      { height: 1280, src: samuraiSecondaryImage, width: 720 },
    ],
    name: "O Espírito do Samurai",
    price: "R$ 179,00",
    whatsappMessage:
      "Olá! Tenho interesse na obra O Espírito do Samurai, no valor de R$ 179,00. Gostaria de saber mais sobre a disponibilidade.",
  },
  {
    description:
      'Um pássaro dourado repousa sobre um galho de momiji, as folhas vermelhas do bordo japonês. Inspirada na tradição da pintura kachō-ga ("flores e pássaros"), a obra traz a delicadeza do outono japonês em tons de ocre, azul e carmim. Acrílico sobre tela, emoldurada.',
    images: [{ height: 1280, src: douradoImage, width: 720 }],
    name: "Pássaro Dourado sobre Momiji",
    price: "R$ 299,00",
    whatsappMessage:
      "Olá! Tenho interesse na obra Pássaro Dourado sobre Momiji, no valor de R$ 299,00. Gostaria de saber mais sobre a disponibilidade.",
  },
];

function ArtworkMedia({ artwork, index }: ArtworkMediaProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [readyImageIndexes, setReadyImageIndexes] = useState<Set<number>>(() => new Set([0]));
  const readyImageIndexesRef = useRef<Set<number>>(new Set([0]));
  const preloadPromisesRef = useRef<Map<number, Promise<boolean>>>(new Map());
  const secondaryPreloadTimerRef = useRef<number | null>(null);
  const navigationRequestRef = useRef(0);
  const isMountedRef = useRef(true);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasMultipleImages = artwork.images.length > 1;
  const frameImage = artwork.images[0];
  const imageAspectRatio = frameImage.width / frameImage.height;
  const mediaStyle = {
    "--artwork-compact-landscape-width": `${115 * imageAspectRatio}svh`,
    "--artwork-desktop-width": `${78 * imageAspectRatio}svh`,
    "--artwork-tablet-width": `${78 * imageAspectRatio}svh`,
  } as CSSProperties;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (secondaryPreloadTimerRef.current !== null) {
        window.clearTimeout(secondaryPreloadTimerRef.current);
      }
    };
  }, []);

  const markImageAsReady = (imageIndex: number) => {
    if (readyImageIndexesRef.current.has(imageIndex)) {
      return;
    }

    readyImageIndexesRef.current.add(imageIndex);

    if (isMountedRef.current) {
      setReadyImageIndexes(new Set(readyImageIndexesRef.current));
    }
  };

  const preloadImage = (imageIndex: number) => {
    if (readyImageIndexesRef.current.has(imageIndex)) {
      return Promise.resolve(true);
    }

    const existingPromise = preloadPromisesRef.current.get(imageIndex);
    if (existingPromise) {
      return existingPromise;
    }

    const image = artwork.images[imageIndex];
    const preloadPromise = new Promise<boolean>((resolve) => {
      const preloader = new Image();
      preloader.decoding = "async";
      preloader.onload = () => {
        markImageAsReady(imageIndex);
        resolve(true);
      };
      preloader.onerror = () => {
        preloadPromisesRef.current.delete(imageIndex);
        resolve(false);
      };
      preloader.src = image.src;
    });

    preloadPromisesRef.current.set(imageIndex, preloadPromise);
    return preloadPromise;
  };

  const scheduleSecondaryImagePreload = () => {
    if (!hasMultipleImages || secondaryPreloadTimerRef.current !== null) {
      return;
    }

    secondaryPreloadTimerRef.current = window.setTimeout(() => {
      artwork.images.slice(1).forEach((_, imageOffset) => {
        void preloadImage(imageOffset + 1);
      });
    }, 600);
  };

  const showImage = (nextImageIndex: number) => {
    const requestId = navigationRequestRef.current + 1;
    navigationRequestRef.current = requestId;

    if (nextImageIndex === activeImageIndex) {
      return;
    }

    if (readyImageIndexesRef.current.has(nextImageIndex)) {
      setActiveImageIndex(nextImageIndex);
      return;
    }

    void preloadImage(nextImageIndex).then((didLoad) => {
      if (!didLoad || !isMountedRef.current || navigationRequestRef.current !== requestId) {
        return;
      }

      window.requestAnimationFrame(() => {
        if (isMountedRef.current && navigationRequestRef.current === requestId) {
          setActiveImageIndex(nextImageIndex);
        }
      });
    });
  };

  const showPreviousImage = () => {
    showImage((activeImageIndex - 1 + artwork.images.length) % artwork.images.length);
  };

  const showNextImage = () => {
    showImage((activeImageIndex + 1) % artwork.images.length);
  };

  const handleKeyboardNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousImage();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextImage();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) {
      return;
    }

    if (deltaX > 0) {
      showPreviousImage();
      return;
    }

    showNextImage();
  };

  return (
    <motion.figure
      className="artworks-collection-media relative min-w-0 bg-surface-container-highest p-2 ring-1 ring-white/10 sm:p-3"
      style={mediaStyle}
      {...getRevealProps({ amount: 0.16, delay: Math.min(index, 2) * 0.06 })}
    >
      <div
        aria-label={hasMultipleImages ? `Galeria da obra ${artwork.name}. Use as setas do teclado para navegar.` : undefined}
        className={`relative isolate w-full overflow-hidden bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary-container ${
          hasMultipleImages ? "touch-pan-y" : ""
        }`}
        onKeyDown={hasMultipleImages ? handleKeyboardNavigation : undefined}
        onTouchCancel={hasMultipleImages ? () => (touchStartRef.current = null) : undefined}
        onTouchEnd={hasMultipleImages ? handleTouchEnd : undefined}
        onTouchStart={hasMultipleImages ? handleTouchStart : undefined}
        style={{ aspectRatio: `${frameImage.width} / ${frameImage.height}` }}
        tabIndex={hasMultipleImages ? 0 : undefined}
      >
        {artwork.images.map((image, imageIndex) => {
          if (hasMultipleImages && !readyImageIndexes.has(imageIndex)) {
            return null;
          }

          const isActive = imageIndex === activeImageIndex;

          return (
            <img
              alt={
                hasMultipleImages
                  ? isActive
                    ? `Obra ${artwork.name} — imagem ${imageIndex + 1} de ${artwork.images.length}`
                    : ""
                  : `Obra ${artwork.name}`
              }
              aria-hidden={hasMultipleImages && !isActive}
              className={`absolute inset-0 block h-full w-full object-contain ${
                hasMultipleImages
                  ? `transition-opacity duration-[250ms] ease-out motion-reduce:transition-none ${
                      isActive ? "z-10 opacity-100" : "z-0 opacity-0"
                    }`
                  : ""
              }`}
              decoding="async"
              fetchPriority={index === 0 && imageIndex === 0 ? "high" : "auto"}
              height={image.height}
              key={image.src}
              loading={index === 0 && imageIndex === 0 ? "eager" : "lazy"}
              onLoad={hasMultipleImages && imageIndex === 0 ? scheduleSecondaryImagePreload : undefined}
              src={image.src}
              width={image.width}
            />
          );
        })}
      </div>

      {hasMultipleImages && (
        <figcaption className="mt-2 flex justify-end sm:mt-3">
          <div
            aria-label={`Navegação das imagens de ${artwork.name}`}
            className="flex items-center border border-outline-variant/70 bg-surface text-on-surface"
            role="group"
          >
            <button
              aria-label={`Imagem anterior de ${artwork.name}`}
              className="inline-flex h-11 w-11 items-center justify-center text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-tertiary-container focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary-container"
              onClick={showPreviousImage}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeLinecap="square" strokeWidth="1.5" />
              </svg>
            </button>

            <p
              aria-live="polite"
              className="min-w-[4.5rem] border-x border-outline-variant/60 px-3 text-center font-label text-[9px] tracking-[0.18em] text-on-surface-variant"
            >
              <span className="text-tertiary-container">{String(activeImageIndex + 1).padStart(2, "0")}</span>
              <span aria-hidden="true"> / </span>
              <span className="sr-only"> de </span>
              {String(artwork.images.length).padStart(2, "0")}
            </p>

            <button
              aria-label={`Próxima imagem de ${artwork.name}`}
              className="inline-flex h-11 w-11 items-center justify-center text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-tertiary-container focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary-container"
              onClick={showNextImage}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="m9.5 5 7 7-7 7" stroke="currentColor" strokeLinecap="square" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </figcaption>
      )}
    </motion.figure>
  );
}

function ComingSoonPage() {
  return (
    <section
      aria-labelledby="artworks-gallery-title"
      className="min-h-screen overflow-x-clip bg-surface-container-low px-4 py-8 sm:px-8 sm:py-10 md:px-12 lg:px-16 lg:py-12"
      style={{ opacity: 1, visibility: "visible" }}
    >
      <div className="mx-auto w-full max-w-[1500px]">
        <motion.header
          className="flex flex-col items-start justify-between gap-6 border-b border-outline-variant/60 pb-7 md:flex-row md:items-end"
          {...getStaggerProps({ amount: 0.2, delayChildren: 0.02, staggerChildren: 0.06 })}
        >
          <div>
            <motion.p
              className="font-label text-[10px] font-medium uppercase tracking-[0.32em] text-tertiary-container"
              {...getStaggerItemProps()}
            >
              OBRAS / QUADROS
            </motion.p>
            <motion.h1
              id="artworks-gallery-title"
              className="mt-3 font-headline text-[clamp(1.8rem,4.5vw,3.6rem)] font-black uppercase leading-[0.95] tracking-[0.055em] text-on-surface"
              {...getStaggerItemProps({ duration: 0.62 })}
            >
              Coleção de Obras Gota
            </motion.h1>
          </div>

          <motion.a
            className="inline-flex shrink-0 items-center justify-center border border-outline-variant/70 px-6 py-3 font-label text-[10px] uppercase tracking-[0.24em] text-on-surface transition-colors duration-500 hover:border-tertiary-container hover:text-tertiary-container"
            href={HOME_ARTWORKS_SECTION_HASH}
            {...getStaggerItemProps({ delay: 0.06 })}
          >
            Voltar ao Início
          </motion.a>
        </motion.header>

        <div className="divide-y divide-outline-variant/60">
          {ARTWORKS.map((artwork, index) => {
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(artwork.whatsappMessage)}`;

            return (
              <article
                className="artworks-collection-card grid grid-cols-1 gap-9 py-10 sm:gap-10 sm:py-12 md:gap-12 md:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] lg:items-center lg:gap-12 xl:gap-16 xl:py-20"
                key={artwork.name}
              >
                <ArtworkMedia artwork={artwork} index={index} />

                <motion.div
                  className="artworks-collection-copy mx-auto w-full min-w-0 max-w-[40rem] lg:mx-0 lg:max-w-[36rem]"
                  {...getStaggerProps({ amount: 0.22, delayChildren: 0.04, staggerChildren: 0.08 })}
                >
                  <motion.div className="flex items-center gap-4" {...getStaggerItemProps()}>
                    <p className="shrink-0 font-label text-[10px] font-medium uppercase tracking-[0.28em] text-tertiary-container">
                      Obra {String(index + 1).padStart(2, "0")}
                    </p>
                    <span aria-hidden="true" className="h-px w-full bg-outline-variant/60" />
                  </motion.div>

                  <motion.h2
                    className="mt-5 max-w-[13ch] text-balance font-headline text-[clamp(1.85rem,7vw,4.25rem)] font-black uppercase leading-[0.96] tracking-[0.025em] text-on-surface sm:mt-6 lg:text-[clamp(2.4rem,4.4vw,4.25rem)]"
                    {...getStaggerItemProps({ duration: 0.66 })}
                  >
                    {artwork.name}
                  </motion.h2>

                  <motion.p
                    className="mt-6 max-w-[58ch] break-words text-pretty text-[0.95rem] leading-[1.7] text-on-surface-variant sm:mt-7 sm:text-[1.02rem]"
                    {...getStaggerItemProps()}
                  >
                    {artwork.description}
                  </motion.p>

                  <motion.div
                    className="artworks-collection-purchase mt-8 flex flex-col items-start gap-5 border-t border-outline-variant/60 pt-6 md:mt-9 md:flex-row md:items-center md:justify-between md:gap-6 md:pt-7"
                    {...getStaggerItemProps({ delay: 0.06 })}
                  >
                    <div>
                      <p className="font-label text-[9px] uppercase tracking-[0.26em] text-on-surface-variant/75">Valor</p>
                      <p className="mt-2 font-headline text-[clamp(1.55rem,3vw,2.1rem)] font-black tracking-[0.02em] text-on-surface">
                        {artwork.price}
                      </p>
                    </div>

                    <a
                      aria-label={`Tenho interesse na obra ${artwork.name}`}
                      className="inline-flex min-h-11 w-full items-center justify-center border border-tertiary-container bg-tertiary-container px-6 py-3 font-label text-[10px] font-medium uppercase tracking-[0.24em] text-on-tertiary-container transition-colors duration-500 hover:bg-transparent hover:text-tertiary-container sm:w-auto"
                      href={whatsappUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Tenho Interesse
                    </a>
                  </motion.div>
                </motion.div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ComingSoonPage;
