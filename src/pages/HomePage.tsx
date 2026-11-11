import { ArrowRightIcon, ArrowUpRightIcon, DownloadIcon, GlobeIcon, MailIcon } from '../components/icons/Icons';
import { Photo } from '../components/Photo/Photo';
import { RouteLink } from '../components/RouteLink/RouteLink';
import { CV_FILENAME, CV_HREF, EMAIL_HREF, GITHUB_HREF, LINKEDIN_HREF, TELEGRAM_HREF } from '../data/contacts';
import { ABOUT_ANCHORS, PATHS, WORK_ANCHORS, withAnchor } from '../data/routes';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useT } from '../i18n';
import ui from '../styles/ui.module.scss';
import { cx } from '../utils/cx';
import { externalLinkProps } from '../utils/links';
import s from './HomePage.module.scss';

/** Зовнішній рядок у плитці контактів: суфікс data-testid, підпис і адреса. */
const EXTERNAL_ROWS: readonly { id: string; label: string; href: string }[] = [
  { id: 'linkedin', label: 'LinkedIn', href: LINKEDIN_HREF },
  { id: 'github', label: 'GitHub', href: GITHUB_HREF },
  { id: 'telegram', label: 'Telegram', href: TELEGRAM_HREF },
];

/**
 * Адреси плиток робіт за їх порядком у `workTiles`: POS-термінал → SkyService POS, FieldQuote → Mobile apps,
 * AI Chat → My projects. Кортеж тієї ж довжини, що й `workTiles`, тож TypeScript не дасть їм розійтися.
 */
const WORK_TILE_HREFS: readonly [string, string, string] = [
  withAnchor(PATHS.work, WORK_ANCHORS.sky),
  withAnchor(PATHS.work, WORK_ANCHORS.apps),
  withAnchor(PATHS.work, WORK_ANCHORS.own),
];

/**
 * Кругла стрілка в куті плитки-посилання; при наведенні на плитку стає оранжевою й повертається.
 */
function TileArrow() {
  return (
    <span className={s.arrC} aria-hidden="true">
      <ArrowUpRightIcon strokeWidth={2} />
    </span>
  );
}

/**
 * Головна сторінка — bento-огляд: інтро з іменем і показниками, фото, три плитки робіт (→ відповідна група на /work),
 * тизер AI-процесу і стек (→ свої секції на /about), оранжева CTA-плитка з email і плитка контактів.
 */
export function HomePage() {
  // Тексти активної мови
  const t = useT();
  useDocumentTitle('home');

  return (
    <div className={cx(ui.pg, s.home)} data-testid="page-home">
      <div className={s.homeGlow} aria-hidden="true" />
      <div className={cx(ui.wrap, ui.relative)}>
        <div className={s.bento}>
          <section className={cx(s.tile, s.tIntro, ui.rise, ui.d1)} data-testid="home-intro">
            <div>
              <span className={s.chip} data-testid="hero-status">
                <span className={s.dot} aria-hidden="true" />
                {t.status}
              </span>
              <h1 className={s.name} aria-label={t.name} data-testid="hero-name">
                {t.nameWords.map((word) => (
                  <span key={word} aria-hidden="true">
                    {word}
                  </span>
                ))}
              </h1>
              <p className={s.headline} data-testid="hero-headline">
                {t.hl.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </p>
              <p className={s.pitch} data-testid="hero-pitch">
                {t.pitch}
              </p>
              <div className={s.cta}>
                <a className={cx(ui.btn, ui.primary)} href={CV_HREF} download={CV_FILENAME} data-testid="cv-hero">
                  <DownloadIcon />
                  {t.cv}
                </a>
                <RouteLink className={ui.btn} to={PATHS.work} data-testid="view-work">
                  {t.viewWork}
                  <ArrowRightIcon className={ui.arr} />
                </RouteLink>
              </div>
            </div>
            <div className={s.istats}>
              {t.istats.map((stat) => (
                <div key={stat.l} data-testid="home-stat">
                  <div className={s.istatV}>{stat.v}</div>
                  <div className={s.istatL}>{stat.l}</div>
                </div>
              ))}
            </div>
          </section>

          <div className={cx(s.tile, s.tPhoto, ui.rise, ui.d2)} data-testid="home-photo">
            <Photo variant="home">
              <div className={s.photoBadge} data-testid="photo-badge">
                <GlobeIcon />
                {t.langs}
              </div>
            </Photo>
          </div>

          {t.workTiles.map((tile, i) => (
            <RouteLink
              key={tile.title}
              className={cx(s.tile, s.tW, ui.reveal)}
              to={WORK_TILE_HREFS[i] ?? PATHS.work}
              data-testid="home-work-tile"
            >
              <div className={s.tTop}>
                <span className={ui.lbl}>{tile.lbl}</span>
                <TileArrow />
              </div>
              <h2 className={s.tH}>{tile.title}</h2>
              <p className={s.tP}>{tile.text}</p>
              <span className={ui.metric}>{tile.metric}</span>
            </RouteLink>
          ))}

          <RouteLink
            className={cx(s.tile, s.tAi, ui.reveal)}
            to={withAnchor(PATHS.about, ABOUT_ANCHORS.ai)}
            data-testid="home-ai-tile"
          >
            <div className={s.tTop}>
              <span className={ui.lbl}>{t.teaserLbl}</span>
              <TileArrow />
            </div>
            <h2 className={s.tH}>{t.teaserTitle}</h2>
            <div className={s.miniFlow}>
              {t.miniFlow.map((step, i) => (
                <span key={step} className={cx(s.mf, i === t.miniFlow.length - 1 && s.done)}>
                  {step}
                </span>
              ))}
            </div>
          </RouteLink>

          <RouteLink
            className={cx(s.tile, s.tStack, ui.reveal)}
            to={withAnchor(PATHS.about, ABOUT_ANCHORS.stack)}
            data-testid="home-stack-tile"
          >
            <div className={s.tTop}>
              <span className={ui.lbl}>{t.stackTitle}</span>
              <TileArrow />
            </div>
            <div className={ui.tags}>
              {t.stackKey.map((tech) => (
                <span key={tech} className={ui.tag}>
                  {tech}
                </span>
              ))}
            </div>
          </RouteLink>

          <div className={cx(s.tile, s.tCta, ui.reveal)} data-testid="home-cta">
            <h2 className={s.ctaH}>
              {t.cHeadA} {t.cHeadB}
            </h2>
            <p className={s.ctaS}>{t.cSub}</p>
            <a className={cx(ui.btn, s.ink)} href={EMAIL_HREF} data-testid="home-email">
              <MailIcon />
              {t.emailMe}
            </a>
          </div>

          <div className={cx(s.tile, s.tLinks, ui.reveal)} data-testid="home-links">
            <span className={ui.lbl}>{t.navContact}</span>
            <div className={s.lrows}>
              {EXTERNAL_ROWS.map((row) => (
                <a
                  key={row.id}
                  className={s.lrow}
                  href={row.href}
                  {...externalLinkProps(row.href)}
                  data-testid={`home-link-${row.id}`}
                >
                  {row.label}
                  <ArrowUpRightIcon />
                </a>
              ))}
              <RouteLink className={s.lrow} to={PATHS.contact} data-testid="home-link-contacts">
                {t.allContacts}
                <ArrowRightIcon size={14} />
              </RouteLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
