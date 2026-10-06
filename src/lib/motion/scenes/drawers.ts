export function mountDrawers(section: HTMLElement): () => void {
  const set = (state: "open" | "closed") => {
    if (section.dataset.drawers !== state) section.dataset.drawers = state;
  };

  const band = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) set("open");
    },
    { rootMargin: "-30% 0px -30% 0px" },
  );

  const viewport = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) set("closed");
  });

  const rect = section.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) set("closed");
  else set("open");

  band.observe(section);
  viewport.observe(section);

  return () => {
    band.disconnect();
    viewport.disconnect();
    delete section.dataset.drawers;
  };
}
