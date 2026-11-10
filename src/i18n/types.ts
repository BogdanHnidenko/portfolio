/** Підтримувані мови інтерфейсу (код `ua` — внутрішній; у `<html lang>` він стає `uk`). */
export type Lang = 'en' | 'ua';

/** Якорі секцій односторінкового сайту, на які ведуть навігація й картки-напрями. */
export type SectionAnchor = '#work' | '#apps' | '#ai' | '#stack' | '#contact';

/** Картка-напрям у hero: короткий опис і якір секції. */
export interface DirectionItem {
  title: string;
  text: string;
  href: '#work' | '#apps' | '#ai';
}

/** Посилання в картці кейсу; порожній `href` означає «ще немає URL» — таке посилання не рендериться. */
export interface CaseLink {
  label: string;
  href: string;
}

/** Кейс у секції Selected work: проблема / рішення / результат, теги й посилання. */
export interface CaseItem {
  n: string;
  org: string;
  title: string;
  metric: string;
  p: string;
  s: string;
  r: string;
  tags: string[];
  links: CaseLink[];
}

/** Картка з прикладом роботи AI-агентів. */
export interface AiCardItem {
  n: string;
  k: string;
  t: string;
}

/** Посада в таймлайні досвіду. */
export interface JobItem {
  role: string;
  org: string;
  period: string;
  place: string;
  bullets: string[];
}

/** Рядок стеку: назва категорії і технології. */
export interface StackGroup {
  name: string;
  items: string[];
}

/**
 * Повний набір текстів сторінки однією мовою.
 * Обидві мови мають реалізувати цей інтерфейс, тож набір ключів у en і ua завжди однаковий.
 */
export interface Dictionary {
  docTitle: string;
  navWork: string;
  navApps: string;
  navAi: string;
  navStack: string;
  navExp: string;
  navContact: string;
  homeLabel: string;
  navPrimaryLabel: string;
  navSectionsLabel: string;
  langLabel: string;
  avatarLabel: string;
  dirsLabel: string;
  dirs: [DirectionItem, DirectionItem, DirectionItem];
  appsTitleA: string;
  appsTitleB: string;
  appsOwn: string;
  appsClient: string;
  groupNames: [string, string];
  groupMeta: [string, string];
  expTitleA: string;
  expTitleB: string;
  cv: string;
  themeLabel: string;
  skip: string;
  status: string;
  name: string;
  nameWords: string[];
  hl: string[];
  pitch: string;
  viewWork: string;
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
  inReview: string;
  featTitle: string;
  featBody: string;
  featStatus: string;
  ndaTitle: string;
  ndaBody: string;
  workTitleA: string;
  workTitleB: string;
  lProblem: string;
  lSolution: string;
  lResult: string;
  cases: [CaseItem, CaseItem, CaseItem, CaseItem];
  jobs: JobItem[];
  stackHead: string;
  stack: StackGroup[];
  cHeadA: string;
  cHeadB: string;
  cSub: string;
  cvPdf: string;
  copy: string;
  langs: string;
}
