import Image from 'next/image';

type BrandProps = {
  href?: string;
  compact?: boolean;
};

export function BrandIdentity({ href = '/', compact = false }: BrandProps) {
  return (
    <a className={`brand-identity${compact ? ' brand-compact' : ''}`} href={href}>
      <Image
        className="brand-mark"
        src="/imivuyo-mark.png"
        alt=""
        width={48}
        height={48}
        priority
      />
      <span className="brand-copy">
        <strong>IMIVUYO</strong>
        <small>Security &amp; Cleaning Services</small>
      </span>
    </a>
  );
}