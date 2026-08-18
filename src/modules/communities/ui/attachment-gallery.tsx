import Image from "next/image";

export function AttachmentGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((src) => (
        <a
          key={src}
          href={src}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        >
          <Image
            src={src}
            alt={alt}
            width={480}
            height={360}
            unoptimized
            className="h-40 w-auto max-w-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}
