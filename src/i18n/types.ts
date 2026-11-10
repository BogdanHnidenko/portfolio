/** Підтримувані мови інтерфейсу (код `ua` — внутрішній; у `<html lang>` він стає `uk`). */
export type Lang = 'en' | 'ua';

/** Сторінки сайту; кожна має власну адресу (див. src/data/routes.ts). */
export type PageId = 'home' | 'work' | 'about' | 'contact';

/** Показник у плитці-інтро на Home: значення і підпис. */
export interface StatItem {
  v: string;
  l: string;
}

/** Плитка роботи на Home: мітка, заголовок, опис і метрика. */
export interface WorkTileItem {
  lbl: string;
  title: string;
  text: string;
  metric: string;
}

/** Посилання в картці кейсу; порожній `href` означає «ще немає URL» — таке посилання не рендериться. */
export interface CaseLink {
  label: string;
  href: string;
}

/** Кейс на сторінці Work: проблема / рішення / результат, теги й посилання. */
export interface CaseItem {
  title: string;
  metric: string;
  p: string;
  s: string;
  r: string;
  tags: string[];
  links: CaseLink[];
}

/** Рядок анкети на About: ключ і значення. */
export interface ProfileRow {
  k: string;
  v: string;
}

/** Посада в таймлайні досвіду. */
export interface JobItem {
  role: string;
  org: string;
  period: string;
  place: string;
  bullets: string[];
}

/** Картка з прикладом роботи AI-агентів. */
export interface AiCardItem {
  k: string;
  t: string;
}

/** Рядок стеку: назва категорії і технології. */
export interface StackGroup {
  name: string;
  items: string[];
}

/**
 * Повний набір текстів сайту однією мовою.
 * Обидві мови мають реалізувати цей інтерфейс, тож набір ключів у en і ua завжди однаковий.
 */
export interface Dictionary {
  titles: Record<PageId, string>;
  navWork: string;
  navAbout: string;
  navContact: string;
  homeLabel: string;
  navPrimaryLabel: string;
  navSectionsLabel: string;
  langLabel: string;
  cv: string;
  themeLabel: string;
  skip: string;
  status: string;
  name: string;
  nameWords: string[];
  hl: string[];
  pitch: string;
  viewWork: string;
  photoAlt: string;
  istats: [StatItem, StatItem, StatItem];
  workTiles: [WorkTileItem, WorkTileItem, WorkTileItem];
  stackKey: string[];
  teaserLbl: string;
  teaserTitle: string;
  miniFlow: string[];
  cHeadA: string;
  cHeadB: string;
  cSub: string;
  emailMe: string;
  allContacts: string;
  workTitleA: string;
  workTitleB: string;
  workLead: string;
  g1: string;
  g1Meta: string;
  g2: string;
  g3: string;
  appsOwn: string;
  appsClient: string;
  inReview: string;
  featTitle: string;
  featBody: string;
  featStatus: string;
  ndaTitle: string;
  ndaBody: string;
  lProblem: string;
  lSolution: string;
  lResult: string;
  cases: [CaseItem, CaseItem, CaseItem, CaseItem];
  aboutTitleA: string;
  aboutTitleB: string;
  prof: ProfileRow[];
  expTitle: string;
  jobs: JobItem[];
  aiEyebrow: string;
  aiTitleA: string;
  aiTitleB: string;
  aiLead: string;
  stPlan: string;
  stBuild: string;
  stReview: string;
  stTest: string;
  stShip: string;
  nPm: string;
  nBack: string;
  nFront: string;
  nMobile: string;
  nSec: string;
  nQa: string;
  nDone: string;
  rail: string;
  aiCards: AiCardItem[];
  tools: string;
  stackTitle: string;
  stack: StackGroup[];
  cvPdf: string;
  copy: string;
  langs: string;
}
