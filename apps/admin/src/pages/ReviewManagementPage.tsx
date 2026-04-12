import { useState, useMemo, useCallback } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Bot,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  Flag,
  Archive,
  BarChart3,
  Eye,
  Minus,
  Copy,
  Check,
  Edit3,
  Sparkles,
  Globe,
  MessageCircle,
  PieChart as PieChartIcon,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ── Types ───────────────────────────────────────────────────────────────────

type Platform = 'AIRBNB' | 'BOOKING_COM' | 'GOOGLE' | 'DIRECT' | 'VRBO' | 'TRIPADVISOR';
type ReviewStatus = 'PENDING_RESPONSE' | 'RESPONDED' | 'FLAGGED' | 'ARCHIVED';
type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
type ResponseTone = 'professional' | 'warm' | 'concise';

interface CategoryRatings {
  cleanliness?: number;
  communication?: number;
  checkIn?: number;
  accuracy?: number;
  location?: number;
  value?: number;
}

interface Review {
  id: string;
  propertyId: string;
  propertyName: string;
  bookingId?: string;
  guestName: string;
  guestEmail?: string;
  source: Platform;
  rating: number;
  categoryRatings?: CategoryRatings;
  title?: string;
  content: string;
  language: string;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  status: ReviewStatus;
  sentiment: Sentiment;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface ResponseTemplate {
  id: string;
  name: string;
  scenario: string;
  content: string;
  tone: ResponseTone;
}

// ── Mock Data (20+ reviews) ────────────────────────────────────────────────

const mockReviews: Review[] = [
  {
    id: 'rev-001', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    bookingId: 'book-040', guestName: 'Hans Mueller', guestEmail: 'hans.m@email.de',
    source: 'AIRBNB', rating: 5,
    categoryRatings: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 5, location: 5, value: 4 },
    title: 'Perfekter Urlaub in Kreta!',
    content: 'Wunderschone Villa mit atemberaubendem Meerblick. Alles war sauber und gut organisiert. Die Kommunikation mit dem Team war hervorragend. Wir kommen definitiv wieder!',
    language: 'de',
    response: 'Thank you, Hans! We are so happy you enjoyed your stay at Villa Elounda. We look forward to welcoming you back to Crete!',
    respondedAt: '2026-04-02T10:00:00Z', respondedBy: 'u-001',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-04-01T08:00:00Z', createdAt: '2026-04-01T08:00:00Z', updatedAt: '2026-04-02T10:00:00Z',
  },
  {
    id: 'rev-002', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt',
    bookingId: 'book-042', guestName: 'Sophie Laurent', guestEmail: 'sophie.l@email.fr',
    source: 'BOOKING_COM', rating: 4,
    categoryRatings: { cleanliness: 4, communication: 5, checkIn: 4, accuracy: 4, location: 5, value: 4 },
    title: 'Charmant appartement',
    content: 'Tres bel appartement dans la vieille ville de Chania. Emplacement parfait pour explorer la ville. Le seul bemol: la climatisation etait un peu bruyante la nuit.',
    language: 'fr', status: 'PENDING_RESPONSE', sentiment: 'POSITIVE',
    publishedAt: '2026-04-05T12:00:00Z', createdAt: '2026-04-05T12:00:00Z', updatedAt: '2026-04-05T12:00:00Z',
  },
  {
    id: 'rev-003', propertyId: 'prop-003', propertyName: 'Rethymno Beach House',
    bookingId: 'book-044', guestName: 'James Wilson', guestEmail: 'j.wilson@email.com',
    source: 'AIRBNB', rating: 3,
    categoryRatings: { cleanliness: 3, communication: 4, checkIn: 3, accuracy: 3, location: 4, value: 3 },
    title: 'Decent but needs improvements',
    content: 'The location is great but the house needs some maintenance work. The pool filter was not working properly and there was a minor leak in the bathroom. The team fixed the pool issue quickly once reported.',
    language: 'en', status: 'FLAGGED', sentiment: 'NEUTRAL',
    publishedAt: '2026-04-08T15:00:00Z', createdAt: '2026-04-08T15:00:00Z', updatedAt: '2026-04-08T15:00:00Z',
  },
  {
    id: 'rev-004', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    guestName: 'Maria Ivanova', guestEmail: 'maria.i@email.ru',
    source: 'GOOGLE', rating: 5,
    title: 'Zamechatelnoye mesto!',
    content: 'Prekrasnaya villa s vidom na more. Vse bylo idealno - chistota, komfort, obsluzhivanie. Osobenno ponravilsya bassein i terassa dlya zavtraka. Rekomenduyu vsem!',
    language: 'ru',
    response: 'Spasibo, Maria! We appreciate your wonderful review. Hope to see you again in Crete!',
    respondedAt: '2026-03-20T09:00:00Z', respondedBy: 'u-002',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-03-18T10:00:00Z', createdAt: '2026-03-18T10:00:00Z', updatedAt: '2026-03-20T09:00:00Z',
  },
  {
    id: 'rev-005', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt',
    bookingId: 'book-038', guestName: 'Erik Johansson',
    source: 'VRBO', rating: 2,
    categoryRatings: { cleanliness: 2, communication: 3, checkIn: 2, accuracy: 2, location: 4, value: 2 },
    title: 'Not as expected',
    content: 'The apartment looked much better in the photos. The furniture was worn and the bathroom needed renovation. Also had trouble with the check-in process as the lockbox code did not work at first.',
    language: 'en', status: 'FLAGGED', sentiment: 'NEGATIVE',
    publishedAt: '2026-03-25T16:00:00Z', createdAt: '2026-03-25T16:00:00Z', updatedAt: '2026-03-25T16:00:00Z',
  },
  {
    id: 'rev-006', propertyId: 'prop-004', propertyName: 'Heraklion City Loft',
    bookingId: 'book-050', guestName: 'Akiko Tanaka', guestEmail: 'akiko.t@email.jp',
    source: 'BOOKING_COM', rating: 5,
    categoryRatings: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 5, location: 4, value: 5 },
    title: 'Wonderful modern loft',
    content: 'Everything was perfect. Very clean, modern furnishings, fast wifi. The host was very responsive and helpful with restaurant recommendations. Would definitely come back.',
    language: 'en',
    response: 'Thank you so much Akiko! We are delighted you had such a great experience. Welcome back anytime!',
    respondedAt: '2026-04-04T14:00:00Z', respondedBy: 'u-001',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-04-03T09:00:00Z', createdAt: '2026-04-03T09:00:00Z', updatedAt: '2026-04-04T14:00:00Z',
  },
  {
    id: 'rev-007', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    bookingId: 'book-035', guestName: 'Carlos Fernandez', guestEmail: 'carlos.f@email.es',
    source: 'AIRBNB', rating: 4,
    categoryRatings: { cleanliness: 5, communication: 4, checkIn: 4, accuracy: 4, location: 5, value: 3 },
    title: 'Gran villa, un poco cara',
    content: 'Villa preciosa con vistas increibles al mar. Todo estaba limpio y bien cuidado. El unico punto negativo es el precio, que es bastante alto para la temporada. Pero la experiencia general fue excelente.',
    language: 'es', status: 'PENDING_RESPONSE', sentiment: 'POSITIVE',
    publishedAt: '2026-03-30T11:00:00Z', createdAt: '2026-03-30T11:00:00Z', updatedAt: '2026-03-30T11:00:00Z',
  },
  {
    id: 'rev-008', propertyId: 'prop-003', propertyName: 'Rethymno Beach House',
    bookingId: 'book-045', guestName: 'Anna Schmidt', guestEmail: 'anna.s@email.de',
    source: 'GOOGLE', rating: 4,
    title: 'Schones Strandhaus',
    content: 'Tolles Strandhaus mit direktem Zugang zum Strand. Das Haus war geraumig und komfortabel. Die Kuche war gut ausgestattet. Der einzige Minuspunkt war der Parkplatz, der etwas weit entfernt war.',
    language: 'de',
    response: 'Vielen Dank, Anna! We are glad you enjoyed the beach house. We are working on improving the parking situation for our guests.',
    respondedAt: '2026-04-06T08:00:00Z', respondedBy: 'u-001',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-04-05T10:00:00Z', createdAt: '2026-04-05T10:00:00Z', updatedAt: '2026-04-06T08:00:00Z',
  },
  {
    id: 'rev-009', propertyId: 'prop-005', propertyName: 'Agios Nikolaos Suite',
    bookingId: 'book-048', guestName: 'Pierre Dubois', guestEmail: 'pierre.d@email.fr',
    source: 'DIRECT', rating: 5,
    title: 'Exceptionnel!',
    content: 'Suite magnifique avec vue sur la baie. Le service etait impeccable. Le petit-dejeuner sur la terrasse etait un reve. Un sejour inoubliable que je recommande vivement a tous.',
    language: 'fr',
    response: 'Merci Pierre! Your kind words mean the world to us. We hope to welcome you back to our beautiful Agios Nikolaos Suite!',
    respondedAt: '2026-04-09T11:00:00Z', respondedBy: 'u-002',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-04-08T07:00:00Z', createdAt: '2026-04-08T07:00:00Z', updatedAt: '2026-04-09T11:00:00Z',
  },
  {
    id: 'rev-010', propertyId: 'prop-004', propertyName: 'Heraklion City Loft',
    guestName: 'John Smith', guestEmail: 'john.s@email.com',
    source: 'TRIPADVISOR', rating: 1,
    title: 'Terrible experience',
    content: 'Do not book this place. The air conditioning was broken, there were insects in the kitchen, and the noise from the street was unbearable. When I complained, the response was very slow. Complete waste of money.',
    language: 'en', status: 'FLAGGED', sentiment: 'NEGATIVE',
    publishedAt: '2026-04-10T18:00:00Z', createdAt: '2026-04-10T18:00:00Z', updatedAt: '2026-04-10T18:00:00Z',
  },
  {
    id: 'rev-011', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt',
    bookingId: 'book-051', guestName: 'Lisa Johnson', guestEmail: 'lisa.j@email.com',
    source: 'AIRBNB', rating: 5,
    categoryRatings: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 5, location: 5, value: 5 },
    title: 'Absolutely perfect stay!',
    content: 'This apartment is a hidden gem in the old town. Walking distance to everything. The host thought of every detail, from the welcome basket to the detailed guidebook. The rooftop terrace was our favorite spot.',
    language: 'en',
    response: 'Thank you Lisa! So glad you discovered our little gem. The rooftop terrace is indeed magical. See you next time!',
    respondedAt: '2026-04-11T09:00:00Z', respondedBy: 'u-001',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-04-10T14:00:00Z', createdAt: '2026-04-10T14:00:00Z', updatedAt: '2026-04-11T09:00:00Z',
  },
  {
    id: 'rev-012', propertyId: 'prop-005', propertyName: 'Agios Nikolaos Suite',
    guestName: 'Marco Rossi', guestEmail: 'marco.r@email.it',
    source: 'BOOKING_COM', rating: 3,
    categoryRatings: { cleanliness: 3, communication: 3, checkIn: 4, accuracy: 3, location: 5, value: 2 },
    title: 'Posizione fantastica, prezzo alto',
    content: 'La posizione della suite e straordinaria con vista sulla baia. Tuttavia il rapporto qualita-prezzo non e dei migliori. Il bagno era piccolo e la colazione basica rispetto al prezzo pagato.',
    language: 'it', status: 'PENDING_RESPONSE', sentiment: 'NEUTRAL',
    publishedAt: '2026-04-07T16:00:00Z', createdAt: '2026-04-07T16:00:00Z', updatedAt: '2026-04-07T16:00:00Z',
  },
  {
    id: 'rev-013', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    bookingId: 'book-052', guestName: 'Emily Chen', guestEmail: 'emily.c@email.com',
    source: 'DIRECT', rating: 5,
    categoryRatings: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 5, location: 5, value: 5 },
    title: 'Dream vacation property',
    content: 'We booked directly and got a great deal. The villa exceeded all expectations. Private pool, stunning views, spacious rooms. The team organized a boat trip for us that was the highlight of our holiday. Cannot recommend enough!',
    language: 'en', status: 'PENDING_RESPONSE', sentiment: 'POSITIVE',
    publishedAt: '2026-04-11T08:00:00Z', createdAt: '2026-04-11T08:00:00Z', updatedAt: '2026-04-11T08:00:00Z',
  },
  {
    id: 'rev-014', propertyId: 'prop-003', propertyName: 'Rethymno Beach House',
    guestName: 'Olga Petrova', guestEmail: 'olga.p@email.ru',
    source: 'GOOGLE', rating: 2,
    title: 'Razochаrovаnie',
    content: 'Dom trebyet remontа. Konditsioner ne rаbotаl kаk sleduyet, gorychаya vodа bylа s pereboiyami. Plyzh ryadom horosho, no dom ne sootvetstvuyet tsenam. Budu iskаt drugoy vаriаnt v sleduyushchiy rаz.',
    language: 'ru', status: 'PENDING_RESPONSE', sentiment: 'NEGATIVE',
    publishedAt: '2026-04-09T13:00:00Z', createdAt: '2026-04-09T13:00:00Z', updatedAt: '2026-04-09T13:00:00Z',
  },
  {
    id: 'rev-015', propertyId: 'prop-004', propertyName: 'Heraklion City Loft',
    bookingId: 'book-053', guestName: 'David Kim', guestEmail: 'david.k@email.com',
    source: 'AIRBNB', rating: 4,
    categoryRatings: { cleanliness: 4, communication: 5, checkIn: 5, accuracy: 4, location: 3, value: 4 },
    title: 'Great loft, noisy area',
    content: 'The loft itself is beautiful and well designed. Very comfortable bed and the kitchen had everything we needed. However, the area can be quite noisy at night due to nearby bars. Light sleepers beware. Overall a good stay.',
    language: 'en',
    response: 'Thank you David! We appreciate the honest feedback. We provide earplugs in the welcome kit and are looking into soundproofing solutions.',
    respondedAt: '2026-04-11T16:00:00Z', respondedBy: 'u-001',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-04-10T20:00:00Z', createdAt: '2026-04-10T20:00:00Z', updatedAt: '2026-04-11T16:00:00Z',
  },
  {
    id: 'rev-016', propertyId: 'prop-005', propertyName: 'Agios Nikolaos Suite',
    bookingId: 'book-054', guestName: 'Yuki Sato', guestEmail: 'yuki.s@email.jp',
    source: 'BOOKING_COM', rating: 5,
    title: 'Subarashii taiken!',
    content: 'The suite was absolutely stunning. Waking up to the view of Mirabello Bay was breathtaking. The staff went above and beyond to make our honeymoon special. The surprise champagne and flowers were such a lovely touch.',
    language: 'en',
    response: 'Congratulations on your honeymoon, Yuki! It was our pleasure to make it special. Wishing you both a lifetime of happiness!',
    respondedAt: '2026-04-07T10:00:00Z', respondedBy: 'u-002',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-04-06T12:00:00Z', createdAt: '2026-04-06T12:00:00Z', updatedAt: '2026-04-07T10:00:00Z',
  },
  {
    id: 'rev-017', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    guestName: 'Robert Brown', guestEmail: 'robert.b@email.com',
    source: 'TRIPADVISOR', rating: 4,
    title: 'Beautiful villa with minor issues',
    content: 'The villa is truly beautiful with amazing views. We had a fantastic week there. A few small issues: the wifi was spotty at times and one of the sun loungers was broken. But the overall experience was wonderful and the location is unbeatable.',
    language: 'en', status: 'PENDING_RESPONSE', sentiment: 'POSITIVE',
    publishedAt: '2026-03-28T09:00:00Z', createdAt: '2026-03-28T09:00:00Z', updatedAt: '2026-03-28T09:00:00Z',
  },
  {
    id: 'rev-018', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt',
    bookingId: 'book-055', guestName: 'Nina Kowalski', guestEmail: 'nina.k@email.pl',
    source: 'VRBO', rating: 5,
    categoryRatings: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 5, location: 5, value: 4 },
    title: 'Cudowne miejsce!',
    content: 'Piekne mieszkanie w samym sercu starego miasta. Wszystko bylo czyste i zadbane. Gospodarz bardzo pomocny, polecil swietne restauracje. Zdecydowanie polecam i wrocemy!',
    language: 'pl',
    response: 'Dziekujemy Nina! So happy you loved your stay. We will have your favorite wine ready for your return visit!',
    respondedAt: '2026-04-03T08:00:00Z', respondedBy: 'u-001',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-04-02T15:00:00Z', createdAt: '2026-04-02T15:00:00Z', updatedAt: '2026-04-03T08:00:00Z',
  },
  {
    id: 'rev-019', propertyId: 'prop-003', propertyName: 'Rethymno Beach House',
    bookingId: 'book-056', guestName: 'Thomas Anderson', guestEmail: 'thomas.a@email.com',
    source: 'DIRECT', rating: 4,
    categoryRatings: { cleanliness: 4, communication: 4, checkIn: 5, accuracy: 4, location: 5, value: 4 },
    title: 'Beach lovers paradise',
    content: 'Perfect location right on the beach. The house is comfortable and well equipped. We loved having breakfast on the terrace watching the sunrise. The only improvement would be updating the kitchen appliances which are a bit dated.',
    language: 'en', status: 'PENDING_RESPONSE', sentiment: 'POSITIVE',
    publishedAt: '2026-04-11T11:00:00Z', createdAt: '2026-04-11T11:00:00Z', updatedAt: '2026-04-11T11:00:00Z',
  },
  {
    id: 'rev-020', propertyId: 'prop-004', propertyName: 'Heraklion City Loft',
    guestName: 'Isabella Garcia', guestEmail: 'isabella.g@email.es',
    source: 'GOOGLE', rating: 3,
    title: 'Bien pero puede mejorar',
    content: 'El loft es bonito y esta bien ubicado para visitar la ciudad. Sin embargo, el aire acondicionado no funcionaba bien y tuvimos que esperar dos dias para que lo arreglaran. El servicio de limpieza podria ser mejor.',
    language: 'es', status: 'PENDING_RESPONSE', sentiment: 'NEUTRAL',
    publishedAt: '2026-04-04T17:00:00Z', createdAt: '2026-04-04T17:00:00Z', updatedAt: '2026-04-04T17:00:00Z',
  },
  {
    id: 'rev-021', propertyId: 'prop-005', propertyName: 'Agios Nikolaos Suite',
    bookingId: 'book-057', guestName: 'Chen Wei', guestEmail: 'chen.w@email.cn',
    source: 'AIRBNB', rating: 5,
    categoryRatings: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 5, location: 5, value: 5 },
    title: 'Best vacation ever!',
    content: 'This suite is absolutely incredible. The panoramic views of the bay are unlike anything I have ever seen. The host arranged a private cooking class where we learned to make traditional Cretan dishes. Every detail was perfect. Already planning our return trip!',
    language: 'en',
    response: 'Thank you Chen Wei! It was a joy to host you. Chef Yannis still talks about how well you mastered the moussaka! Cannot wait to see you again!',
    respondedAt: '2026-04-12T07:00:00Z', respondedBy: 'u-001',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-04-11T22:00:00Z', createdAt: '2026-04-11T22:00:00Z', updatedAt: '2026-04-12T07:00:00Z',
  },
  {
    id: 'rev-022', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    bookingId: 'book-058', guestName: 'Sarah Mitchell', guestEmail: 'sarah.m@email.com',
    source: 'BOOKING_COM', rating: 4,
    categoryRatings: { cleanliness: 4, communication: 4, checkIn: 4, accuracy: 4, location: 5, value: 3 },
    title: 'Lovely villa, pricey but worth it',
    content: 'The villa is stunning and the location is perfect. The pool area is beautiful and the views are to die for. We felt it was a bit overpriced for the region but the quality of the property and service justified it in the end. Would recommend for a special occasion.',
    language: 'en', status: 'PENDING_RESPONSE', sentiment: 'POSITIVE',
    publishedAt: '2026-04-12T06:00:00Z', createdAt: '2026-04-12T06:00:00Z', updatedAt: '2026-04-12T06:00:00Z',
  },
  {
    id: 'rev-023', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt',
    guestName: 'Ahmed Hassan', guestEmail: 'ahmed.h@email.com',
    source: 'GOOGLE', rating: 1,
    title: 'Very disappointed',
    content: 'The apartment was nothing like the photos. Dirty on arrival, broken shower handle, stains on the bedsheets. When I contacted the host, they were dismissive. Had to find alternative accommodation for the last two nights. Requesting a refund.',
    language: 'en', status: 'FLAGGED', sentiment: 'NEGATIVE',
    publishedAt: '2026-03-15T20:00:00Z', createdAt: '2026-03-15T20:00:00Z', updatedAt: '2026-03-15T20:00:00Z',
  },
  {
    id: 'rev-024', propertyId: 'prop-003', propertyName: 'Rethymno Beach House',
    bookingId: 'book-059', guestName: 'Francesca Bianchi', guestEmail: 'francesca.b@email.it',
    source: 'AIRBNB', rating: 5,
    categoryRatings: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 5, location: 5, value: 5 },
    title: 'Paradiso sulla spiaggia!',
    content: 'Casa meravigliosa direttamente sulla spiaggia. Abbiamo trascorso una settimana indimenticabile. I bambini hanno adorato giocare sulla spiaggia ogni giorno. La casa aveva tutto cio di cui avevamo bisogno. Torneremo sicuramente!',
    language: 'it',
    response: 'Grazie mille Francesca! We are so happy your family had such a wonderful time. The beach is perfect for children. Arrivederci and see you soon!',
    respondedAt: '2026-04-08T09:00:00Z', respondedBy: 'u-002',
    status: 'RESPONDED', sentiment: 'POSITIVE',
    publishedAt: '2026-04-07T08:00:00Z', createdAt: '2026-04-07T08:00:00Z', updatedAt: '2026-04-08T09:00:00Z',
  },
];

// ── Response Templates ─────────────────────────────────────────────────────

const responseTemplates: ResponseTemplate[] = [
  {
    id: 'tpl-001', name: 'Positive - Thank You', scenario: 'positive',
    content: 'Dear {guestName}, thank you so much for your wonderful review! We are thrilled that you enjoyed your stay at {propertyName}. Your kind words mean a lot to our team. We hope to welcome you back to Crete soon!',
    tone: 'warm',
  },
  {
    id: 'tpl-002', name: 'Positive - Professional', scenario: 'positive',
    content: 'Dear {guestName}, we appreciate you taking the time to share your experience at {propertyName}. We are pleased to know that our property and services met your expectations. We look forward to hosting you again in the future.',
    tone: 'professional',
  },
  {
    id: 'tpl-003', name: 'Negative - Apology', scenario: 'negative',
    content: 'Dear {guestName}, thank you for your honest feedback regarding your stay at {propertyName}. We sincerely apologize for the issues you experienced. We take all guest concerns seriously and have already begun addressing the points you raised. We would welcome the opportunity to make things right on a future visit.',
    tone: 'professional',
  },
  {
    id: 'tpl-004', name: 'Negative - Maintenance Issue', scenario: 'maintenance',
    content: 'Dear {guestName}, we are sorry to hear about the maintenance issues during your stay at {propertyName}. This falls below our standards and we have immediately scheduled repairs. We would like to offer you a discount on your next booking as a gesture of goodwill.',
    tone: 'professional',
  },
  {
    id: 'tpl-005', name: 'Neutral - Balanced', scenario: 'neutral',
    content: 'Dear {guestName}, thank you for sharing your balanced feedback about {propertyName}. We are glad you enjoyed certain aspects of your stay and appreciate your constructive suggestions. We are continuously working to improve our properties and your input helps us do that.',
    tone: 'professional',
  },
  {
    id: 'tpl-006', name: 'Positive - Concise', scenario: 'positive',
    content: 'Thank you for the great review, {guestName}! Glad you loved {propertyName}. See you next time!',
    tone: 'concise',
  },
  {
    id: 'tpl-007', name: 'Value Concern', scenario: 'value',
    content: 'Dear {guestName}, thank you for your feedback about {propertyName}. We understand that value for money is important and we regularly review our pricing to ensure it reflects the quality and experience we provide. We offer seasonal discounts and direct booking benefits that may interest you for future stays.',
    tone: 'professional',
  },
];

// ── Chart Data ─────────────────────────────────────────────────────────────

const ratingOverTimeData = [
  { month: 'Oct 2025', rating: 4.1, reviews: 8 },
  { month: 'Nov 2025', rating: 4.3, reviews: 6 },
  { month: 'Dec 2025', rating: 4.0, reviews: 4 },
  { month: 'Jan 2026', rating: 4.2, reviews: 5 },
  { month: 'Feb 2026', rating: 4.4, reviews: 7 },
  { month: 'Mar 2026', rating: 4.1, reviews: 10 },
  { month: 'Apr 2026', rating: 4.3, reviews: 12 },
];

const reviewsPerMonthData = [
  { month: 'Oct', count: 8, responded: 7 },
  { month: 'Nov', count: 6, responded: 5 },
  { month: 'Dec', count: 4, responded: 4 },
  { month: 'Jan', count: 5, responded: 4 },
  { month: 'Feb', count: 7, responded: 6 },
  { month: 'Mar', count: 10, responded: 8 },
  { month: 'Apr', count: 12, responded: 9 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const platformConfig: Record<Platform, { label: string; color: string; bg: string }> = {
  AIRBNB: { label: 'Airbnb', color: 'text-[#FF5A5F]', bg: 'bg-[#FF5A5F]/10' },
  BOOKING_COM: { label: 'Booking.com', color: 'text-[#003580]', bg: 'bg-[#003580]/10' },
  GOOGLE: { label: 'Google', color: 'text-[#4285F4]', bg: 'bg-[#4285F4]/10' },
  DIRECT: { label: 'Direct', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  VRBO: { label: 'VRBO', color: 'text-[#3B5998]', bg: 'bg-[#3B5998]/10' },
  TRIPADVISOR: { label: 'TripAdvisor', color: 'text-[#00AF87]', bg: 'bg-[#00AF87]/10' },
};

const statusConfig: Record<ReviewStatus, { label: string; badge: string }> = {
  PENDING_RESPONSE: { label: 'Needs Response', badge: 'bg-amber-500/10 text-amber-600' },
  RESPONDED: { label: 'Responded', badge: 'bg-success/10 text-success' },
  FLAGGED: { label: 'Flagged', badge: 'bg-error/10 text-error' },
  ARCHIVED: { label: 'Archived', badge: 'bg-outline-variant/20 text-on-surface-variant' },
};

const sentimentConfig: Record<Sentiment, { label: string; color: string; Icon: typeof ThumbsUp }> = {
  POSITIVE: { label: 'Positive', color: 'text-success', Icon: ThumbsUp },
  NEUTRAL: { label: 'Neutral', color: 'text-amber-500', Icon: Minus },
  NEGATIVE: { label: 'Negative', color: 'text-error', Icon: ThumbsDown },
};

const CHART_COLORS = {
  primary: '#7C5CFC',
  secondary: '#A78BFA',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  muted: '#6B7280',
};

const SENTIMENT_COLORS = [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.error];

const RATING_COLORS: Record<number, string> = {
  5: '#10B981',
  4: '#34D399',
  3: '#F59E0B',
  2: '#F97316',
  1: '#EF4444',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

function getInitialsColor(name: string): string {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-indigo-500 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sizeClass} ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-outline-variant/30'}`}
        />
      ))}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const cfg = platformConfig[platform];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      <Globe className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  trend,
  trendLabel,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  icon: typeof Star;
  accent?: string;
}) {
  const isPositive = (trend ?? 0) >= 0;
  return (
    <div className="glass-card rounded-xl p-5 ambient-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent || 'bg-secondary/10'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-white' : 'text-secondary'}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-success' : 'text-error'}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-on-surface">{value}</span>
        {suffix && <span className="text-sm text-on-surface-variant">{suffix}</span>}
      </div>
      <p className="text-xs text-on-surface-variant mt-1">{label}</p>
      {trendLabel && (
        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{trendLabel}</p>
      )}
    </div>
  );
}

// ── AI Response Modal ──────────────────────────────────────────────────────

function AiResponseModal({
  review,
  onClose,
  onSelectResponse,
}: {
  review: Review;
  onClose: () => void;
  onSelectResponse: (text: string) => void;
}) {
  const [generating, setGenerating] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const generatedResponses = useMemo(() => {
    const name = review.guestName;
    const prop = review.propertyName;
    const sentiment = review.sentiment;

    const professional = sentiment === 'NEGATIVE'
      ? `Dear ${name},\n\nThank you for taking the time to share your experience at ${prop}. We sincerely apologize for the issues you encountered during your stay. Your feedback is invaluable and we have immediately taken action to address each concern you raised.\n\nWe have escalated the maintenance items to our property care team and implemented new quality checks to prevent similar issues. We would be grateful for the opportunity to demonstrate our improved standards on a future visit.\n\nPlease feel free to contact us directly to discuss any further concerns.\n\nWarm regards,\nSivan Property Management`
      : sentiment === 'NEUTRAL'
      ? `Dear ${name},\n\nThank you for your thoughtful review of ${prop}. We appreciate your balanced perspective and are glad you enjoyed several aspects of your stay.\n\nWe have noted your suggestions and are actively working on improvements, particularly in the areas you mentioned. Your constructive feedback helps us enhance the experience for all our guests.\n\nWe hope to welcome you back and exceed your expectations next time.\n\nBest regards,\nSivan Property Management`
      : `Dear ${name},\n\nThank you for your wonderful review of ${prop}! We are delighted to hear that your stay exceeded expectations.\n\nOur team takes great pride in providing exceptional hospitality, and your recognition of our efforts is truly appreciated. It was a pleasure hosting you.\n\nWe look forward to welcoming you back to Crete for another memorable experience.\n\nBest regards,\nSivan Property Management`;

    const warm = sentiment === 'NEGATIVE'
      ? `Hi ${name},\n\nFirst of all, we want to say how sorry we are about your experience at ${prop}. This is not the standard of hospitality we aim to provide, and we completely understand your frustration.\n\nWe have taken your feedback to heart and are already making changes. We would love the chance to make it up to you -- please reach out to us personally so we can discuss how to turn things around.\n\nThank you for helping us be better.\n\nWith warm regards,\nThe Sivan Team`
      : sentiment === 'NEUTRAL'
      ? `Hi ${name},\n\nThank you so much for sharing your experience at ${prop}! We are happy you enjoyed parts of your stay, and we really appreciate your honest feedback on where we can improve.\n\nWe are already looking into the points you mentioned. Your input genuinely helps us create better experiences.\n\nWe would love to have you back and show you the improvements!\n\nWarmly,\nThe Sivan Team`
      : `Hi ${name}!\n\nWow, your review made our day! We are so thrilled you loved your stay at ${prop}. It was such a pleasure having you as our guest.\n\nMoments like these remind us why we love what we do. You were wonderful guests and we genuinely hope to see you again soon!\n\nSending warm wishes from sunny Crete,\nThe Sivan Team`;

    const concise = sentiment === 'NEGATIVE'
      ? `Dear ${name}, thank you for your feedback on ${prop}. We apologize for the issues and have addressed them. We would welcome another chance to provide the experience you deserve.`
      : sentiment === 'NEUTRAL'
      ? `Thank you for your review, ${name}. We appreciate the balanced feedback on ${prop} and are working on the improvements you suggested. Hope to see you again!`
      : `Thank you for the amazing review, ${name}! So glad you loved ${prop}. We cannot wait to welcome you back!`;

    return [
      { tone: 'professional' as const, label: 'Professional', text: professional },
      { tone: 'warm' as const, label: 'Warm & Friendly', text: warm },
      { tone: 'concise' as const, label: 'Concise', text: concise },
    ];
  }, [review]);

  const [editedTexts, setEditedTexts] = useState<string[]>(generatedResponses.map((r) => r.text));

  // Simulate generation delay
  useState(() => {
    const timer = setTimeout(() => setGenerating(false), 1200);
    return () => clearTimeout(timer);
  });

  const handleCopy = (idx: number) => {
    navigator.clipboard.writeText(editedTexts[idx]);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-surface rounded-2xl ambient-shadow border border-outline-variant/10">
        {/* Header */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/10 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">AI Response Generator</h3>
              <p className="text-xs text-on-surface-variant">3 response styles for {review.guestName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-variant/50 transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Review context */}
        <div className="px-6 py-4 bg-surface-variant/30 border-b border-outline-variant/10">
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={review.rating} size="sm" />
            <PlatformBadge platform={review.source} />
            <span className={`text-xs font-medium ${sentimentConfig[review.sentiment].color}`}>
              {sentimentConfig[review.sentiment].label}
            </span>
          </div>
          <p className="text-sm text-on-surface line-clamp-2">&ldquo;{review.content}&rdquo;</p>
        </div>

        {/* Generated responses */}
        <div className="p-6 space-y-4">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-secondary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-secondary animate-spin" />
              </div>
              <p className="text-sm text-on-surface-variant">Generating AI responses...</p>
            </div>
          ) : (
            generatedResponses.map((resp, idx) => (
              <div
                key={resp.tone}
                className="glass-card rounded-xl border border-outline-variant/10 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-surface-variant/30 border-b border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-semibold text-on-surface">{resp.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      resp.tone === 'professional' ? 'bg-blue-500/10 text-blue-600' :
                      resp.tone === 'warm' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {resp.tone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                      className="p-1.5 rounded-lg hover:bg-surface-variant/50 transition-colors text-on-surface-variant hover:text-on-surface"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(idx)}
                      className="p-1.5 rounded-lg hover:bg-surface-variant/50 transition-colors text-on-surface-variant hover:text-on-surface"
                      title="Copy"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {editingIdx === idx ? (
                    <textarea
                      value={editedTexts[idx]}
                      onChange={(e) => {
                        const updated = [...editedTexts];
                        updated[idx] = e.target.value;
                        setEditedTexts(updated);
                      }}
                      className="w-full min-h-[120px] bg-transparent text-sm text-on-surface resize-y outline-none"
                    />
                  ) : (
                    <p className="text-sm text-on-surface whitespace-pre-line">{editedTexts[idx]}</p>
                  )}
                </div>
                <div className="px-4 pb-3 flex justify-end">
                  <button
                    onClick={() => onSelectResponse(editedTexts[idx])}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Use This Response
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Templates Panel ────────────────────────────────────────────────────────

function TemplatesPanel({
  review,
  onSelectTemplate,
  onClose,
}: {
  review: Review;
  onSelectTemplate: (text: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface rounded-2xl ambient-shadow border border-outline-variant/10">
        <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/10 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Response Templates</h3>
              <p className="text-xs text-on-surface-variant">{responseTemplates.length} templates available</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-variant/50 transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {responseTemplates.map((tpl) => {
            const filled = tpl.content
              .replace(/{guestName}/g, review.guestName)
              .replace(/{propertyName}/g, review.propertyName);
            return (
              <div
                key={tpl.id}
                className="glass-card rounded-xl border border-outline-variant/10 p-4 hover:border-secondary/30 transition-colors cursor-pointer group"
                onClick={() => onSelectTemplate(filled)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-on-surface">{tpl.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    tpl.tone === 'professional' ? 'bg-blue-500/10 text-blue-600' :
                    tpl.tone === 'warm' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {tpl.tone}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2">{filled}</p>
                <div className="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium text-secondary flex items-center gap-1">
                    <Check className="w-3 h-3" /> Use template
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Review Card ────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onRespond,
  onFlag,
  onArchive,
  onOpenAi,
  onOpenTemplates,
}: {
  review: Review;
  onRespond: (id: string, text: string) => void;
  onFlag: (id: string) => void;
  onArchive: (id: string) => void;
  onOpenAi: (review: Review) => void;
  onOpenTemplates: (review: Review) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const sentimentCfg = sentimentConfig[review.sentiment];
  const SentimentIcon = sentimentCfg.Icon;
  const isLong = review.content.length > 200;

  const handleSend = () => {
    if (!replyText.trim()) return;
    setSending(true);
    setTimeout(() => {
      onRespond(review.id, replyText);
      setShowReplyBox(false);
      setReplyText('');
      setSending(false);
    }, 600);
  };

  // Allow AI/template modals to inject text
  const injectReply = useCallback((text: string) => {
    setReplyText(text);
    setShowReplyBox(true);
  }, []);

  return (
    <div className="glass-card rounded-xl ambient-shadow overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getInitialsColor(review.guestName)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {getInitials(review.guestName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-on-surface text-sm">{review.guestName}</span>
            <PlatformBadge platform={review.source} />
            <span className={`flex items-center gap-0.5 text-xs font-medium ${sentimentCfg.color}`}>
              <SentimentIcon className="w-3 h-3" />
              {sentimentCfg.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[review.status].badge}`}>
              {statusConfig[review.status].label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-on-surface-variant">{formatDate(review.publishedAt)}</span>
            <span className="text-xs text-on-surface-variant/60">|</span>
            <span className="text-xs text-on-surface-variant">{review.propertyName}</span>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {review.status !== 'FLAGGED' && (
            <button
              onClick={() => onFlag(review.id)}
              title="Flag review"
              className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
          {review.status !== 'ARCHIVED' && (
            <button
              onClick={() => onArchive(review.id)}
              title="Archive review"
              className="p-1.5 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Review title & content */}
      <div className="px-5 pb-4">
        {review.title && (
          <p className="text-sm font-semibold text-on-surface mb-1">&ldquo;{review.title}&rdquo;</p>
        )}
        <p className={`text-sm text-on-surface-variant leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
          {review.content}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-1 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Response section */}
      {review.response ? (
        <div className="mx-5 mb-4 p-4 rounded-xl bg-surface-variant/30 border-s-2 border-secondary/40">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs font-semibold text-secondary">Your Response</span>
            {review.respondedAt && (
              <span className="text-[10px] text-on-surface-variant">{formatDate(review.respondedAt)}</span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{review.response}</p>
        </div>
      ) : (
        <div className="px-5 pb-4">
          {showReplyBox ? (
            <div className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-secondary/40 transition-colors resize-y"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAi(review)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Assist
                  </button>
                  <button
                    onClick={() => onOpenTemplates(review)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-variant/50 text-on-surface-variant text-xs font-medium hover:bg-surface-variant transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Templates
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowReplyBox(false); setReplyText(''); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!replyText.trim() || sending}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg gradient-accent text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {sending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {sending ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReplyBox(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <MessageSquare className="w-4 h-4" />
                Respond
              </button>
              <button
                onClick={() => {
                  onOpenAi(review);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors"
              >
                <Bot className="w-4 h-4" />
                AI Response
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type ActiveTab = 'feed' | 'analytics' | 'templates';

export default function ReviewManagementPage() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modals
  const [aiModalReview, setAiModalReview] = useState<Review | null>(null);
  const [templatesReview, setTemplatesReview] = useState<Review | null>(null);
  // Track which review card should receive injected text
  const [injectTarget, setInjectTarget] = useState<{ id: string; text: string } | null>(null);

  // Properties derived from reviews
  const properties = useMemo(() => {
    const map = new Map<string, string>();
    mockReviews.forEach((r) => map.set(r.propertyId, r.propertyName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, []);

  // Filter logic
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.guestName.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          (r.title && r.title.toLowerCase().includes(q)) ||
          r.propertyName.toLowerCase().includes(q),
      );
    }
    if (filterProperty !== 'all') result = result.filter((r) => r.propertyId === filterProperty);
    if (filterPlatform !== 'all') result = result.filter((r) => r.source === filterPlatform);
    if (filterRating !== 'all') {
      const [min, max] = filterRating.split('-').map(Number);
      result = result.filter((r) => r.rating >= min && r.rating <= max);
    }
    if (filterStatus !== 'all') result = result.filter((r) => r.status === filterStatus);
    if (filterDateFrom) result = result.filter((r) => r.publishedAt >= filterDateFrom);
    if (filterDateTo) result = result.filter((r) => r.publishedAt <= filterDateTo + 'T23:59:59Z');

    return result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [reviews, searchQuery, filterProperty, filterPlatform, filterRating, filterStatus, filterDateFrom, filterDateTo]);

  // Stats
  const stats = useMemo(() => {
    const total = reviews.length;
    const avgRating = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const responded = reviews.filter((r) => r.status === 'RESPONDED').length;
    const responseRate = total > 0 ? (responded / total) * 100 : 0;

    const byRating = [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: reviews.filter((rv) => rv.rating === r).length,
      pct: total > 0 ? (reviews.filter((rv) => rv.rating === r).length / total) * 100 : 0,
    }));

    const byPlatform: Record<string, number> = {};
    reviews.forEach((r) => { byPlatform[r.source] = (byPlatform[r.source] || 0) + 1; });

    const bySentiment = {
      positive: reviews.filter((r) => r.sentiment === 'POSITIVE').length,
      neutral: reviews.filter((r) => r.sentiment === 'NEUTRAL').length,
      negative: reviews.filter((r) => r.sentiment === 'NEGATIVE').length,
    };

    return { total, avgRating: Math.round(avgRating * 10) / 10, responseRate: Math.round(responseRate), responded, byRating, byPlatform, bySentiment };
  }, [reviews]);

  const sentimentChartData = useMemo(() => [
    { name: 'Positive', value: stats.bySentiment.positive },
    { name: 'Neutral', value: stats.bySentiment.neutral },
    { name: 'Negative', value: stats.bySentiment.negative },
  ], [stats.bySentiment]);

  // Actions
  const handleRespond = useCallback((id: string, text: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, response: text, respondedAt: new Date().toISOString(), status: 'RESPONDED' as const, updatedAt: new Date().toISOString() }
          : r,
      ),
    );
  }, []);

  const handleFlag = useCallback((id: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'FLAGGED' as const, updatedAt: new Date().toISOString() } : r,
      ),
    );
  }, []);

  const handleArchive = useCallback((id: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'ARCHIVED' as const, updatedAt: new Date().toISOString() } : r,
      ),
    );
  }, []);

  const handleAiSelect = useCallback((text: string) => {
    if (aiModalReview) {
      setInjectTarget({ id: aiModalReview.id, text });
      setAiModalReview(null);
    }
  }, [aiModalReview]);

  const handleTemplateSelect = useCallback((text: string) => {
    if (templatesReview) {
      setInjectTarget({ id: templatesReview.id, text });
      setTemplatesReview(null);
    }
  }, [templatesReview]);

  const clearFilters = () => {
    setFilterProperty('all');
    setFilterPlatform('all');
    setFilterRating('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
  };

  const hasActiveFilters = filterProperty !== 'all' || filterPlatform !== 'all' || filterRating !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo || searchQuery;

  const tabs: { key: ActiveTab; label: string; icon: typeof Star }[] = [
    { key: 'feed', label: 'Reviews Feed', icon: MessageSquare },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'templates', label: 'Templates', icon: FileText },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Review Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Monitor guest reviews, respond promptly, and track your reputation across platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'gradient-accent text-white'
                : 'glass-card ambient-shadow text-on-surface hover:bg-surface-variant/50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white/80" />
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Reviews"
          value={stats.total}
          icon={MessageSquare}
          trend={15}
          trendLabel="vs last month"
          accent="gradient-accent"
        />
        <KpiCard
          label="Average Rating"
          value={stats.avgRating}
          suffix="/ 5"
          icon={Star}
          trend={3.2}
          trendLabel="vs last month"
        />
        <KpiCard
          label="Response Rate"
          value={`${stats.responseRate}%`}
          icon={MessageCircle}
          trend={8}
          trendLabel={`${stats.responded} responded`}
        />
        <KpiCard
          label="Positive Reviews"
          value={stats.bySentiment.positive}
          suffix={`/ ${stats.total}`}
          icon={ThumbsUp}
          trend={5}
        />
        <div className="glass-card rounded-xl p-5 ambient-shadow col-span-2 md:col-span-4 lg:col-span-1">
          <p className="text-xs font-medium text-on-surface-variant mb-3">By Platform</p>
          <div className="space-y-2">
            {Object.entries(stats.byPlatform).map(([platform, count]) => {
              const cfg = platformConfig[platform as Platform];
              return (
                <div key={platform} className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs font-bold text-on-surface">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="glass-card rounded-xl p-5 ambient-shadow">
        <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-secondary" />
          Rating Distribution
        </h3>
        <div className="space-y-2.5">
          {stats.byRating.map(({ rating, count, pct }) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-20 flex-shrink-0">
                <span className="text-sm font-semibold text-on-surface w-3">{rating}</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
              <div className="flex-1 h-5 bg-surface-variant/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: RATING_COLORS[rating],
                  }}
                />
              </div>
              <span className="text-xs font-medium text-on-surface w-8 text-end">{count}</span>
              <span className="text-xs text-on-surface-variant w-10 text-end">{Math.round(pct)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-card rounded-xl p-5 ambient-shadow space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <Filter className="w-4 h-4 text-secondary" />
              Filter Reviews
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews by guest, content, property..."
              className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-secondary/40 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Property */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Property</label>
              <select
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              >
                <option value="all">All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Platform</label>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              >
                <option value="all">All Platforms</option>
                {Object.entries(platformConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Rating</label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              >
                <option value="all">All Ratings</option>
                <option value="5-5">5 Stars</option>
                <option value="4-4">4 Stars</option>
                <option value="3-3">3 Stars</option>
                <option value="2-2">2 Stars</option>
                <option value="1-1">1 Star</option>
                <option value="4-5">4-5 Stars</option>
                <option value="1-3">1-3 Stars</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING_RESPONSE">Needs Response</option>
                <option value="RESPONDED">Responded</option>
                <option value="FLAGGED">Flagged</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-xl glass-card ambient-shadow w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'gradient-accent text-white shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          {/* Reviews list */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="glass-card rounded-xl p-12 ambient-shadow flex flex-col items-center justify-center">
                <Eye className="w-12 h-12 text-on-surface-variant/30 mb-4" />
                <p className="text-sm font-medium text-on-surface-variant">No reviews match your filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <ReviewCardWrapper
                  key={review.id}
                  review={review}
                  onRespond={handleRespond}
                  onFlag={handleFlag}
                  onArchive={handleArchive}
                  onOpenAi={setAiModalReview}
                  onOpenTemplates={setTemplatesReview}
                  injectTarget={injectTarget}
                  clearInject={() => setInjectTarget(null)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Over Time */}
          <div className="glass-card rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" />
              Average Rating Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2.5}
                    dot={{ fill: CHART_COLORS.primary, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: CHART_COLORS.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reviews Per Month */}
          <div className="glass-card rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-secondary" />
              Reviews Per Month
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reviewsPerMonthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="count" name="Total Reviews" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="responded" name="Responded" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sentiment Analysis */}
          <div className="glass-card rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-secondary" />
              Sentiment Analysis
            </h3>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    strokeWidth={0}
                    paddingAngle={3}
                  >
                    {sentimentChartData.map((_, idx) => (
                      <Cell key={idx} fill={SENTIMENT_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: number, name: string) => [`${value} reviews`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value: string, entry: any) => (
                      <span style={{ color: entry.color }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Averages */}
          <div className="glass-card rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary" />
              Category Averages
            </h3>
            <div className="space-y-3">
              {(['cleanliness', 'communication', 'checkIn', 'accuracy', 'location', 'value'] as const).map((cat) => {
                const reviewsWithCat = reviews.filter((r) => r.categoryRatings?.[cat] !== undefined);
                const avg = reviewsWithCat.length > 0
                  ? reviewsWithCat.reduce((s, r) => s + (r.categoryRatings![cat] || 0), 0) / reviewsWithCat.length
                  : 0;
                const roundedAvg = Math.round(avg * 10) / 10;
                const pct = (avg / 5) * 100;
                const label = cat === 'checkIn' ? 'Check-in' : cat.charAt(0).toUpperCase() + cat.slice(1);
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant w-24 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-4 bg-surface-variant/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary-container transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-on-surface w-8 text-end">{roundedAvg}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">
              {responseTemplates.length} response templates for common scenarios
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {responseTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="glass-card rounded-xl p-5 ambient-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-on-surface">{tpl.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    tpl.tone === 'professional' ? 'bg-blue-500/10 text-blue-600' :
                    tpl.tone === 'warm' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {tpl.tone}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    tpl.scenario === 'positive' ? 'bg-success/10 text-success' :
                    tpl.scenario === 'negative' ? 'bg-error/10 text-error' :
                    tpl.scenario === 'maintenance' ? 'bg-amber-500/10 text-amber-600' :
                    tpl.scenario === 'value' ? 'bg-blue-500/10 text-blue-600' :
                    'bg-outline-variant/20 text-on-surface-variant'
                  }`}>
                    {tpl.scenario}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {tpl.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Response Modal */}
      {aiModalReview && (
        <AiResponseModal
          review={aiModalReview}
          onClose={() => setAiModalReview(null)}
          onSelectResponse={handleAiSelect}
        />
      )}

      {/* Templates Modal */}
      {templatesReview && (
        <TemplatesPanel
          review={templatesReview}
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setTemplatesReview(null)}
        />
      )}
    </div>
  );
}

// ── Wrapper to handle injected text from AI/Templates ──────────────────────

function ReviewCardWrapper({
  review,
  onRespond,
  onFlag,
  onArchive,
  onOpenAi,
  onOpenTemplates,
  injectTarget,
  clearInject,
}: {
  review: Review;
  onRespond: (id: string, text: string) => void;
  onFlag: (id: string) => void;
  onArchive: (id: string) => void;
  onOpenAi: (review: Review) => void;
  onOpenTemplates: (review: Review) => void;
  injectTarget: { id: string; text: string } | null;
  clearInject: () => void;
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const sentimentCfg = sentimentConfig[review.sentiment];
  const SentimentIcon = sentimentCfg.Icon;
  const isLong = review.content.length > 200;

  // Handle injected text from AI or templates
  if (injectTarget && injectTarget.id === review.id && replyText !== injectTarget.text) {
    setReplyText(injectTarget.text);
    setShowReplyBox(true);
    clearInject();
  }

  const handleSend = () => {
    if (!replyText.trim()) return;
    setSending(true);
    setTimeout(() => {
      onRespond(review.id, replyText);
      setShowReplyBox(false);
      setReplyText('');
      setSending(false);
    }, 600);
  };

  return (
    <div className="glass-card rounded-xl ambient-shadow overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getInitialsColor(review.guestName)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {getInitials(review.guestName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-on-surface text-sm">{review.guestName}</span>
            <PlatformBadge platform={review.source} />
            <span className={`flex items-center gap-0.5 text-xs font-medium ${sentimentCfg.color}`}>
              <SentimentIcon className="w-3 h-3" />
              {sentimentCfg.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[review.status].badge}`}>
              {statusConfig[review.status].label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-on-surface-variant">{formatDate(review.publishedAt)}</span>
            <span className="text-xs text-on-surface-variant/60">|</span>
            <span className="text-xs text-on-surface-variant">{review.propertyName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {review.status !== 'FLAGGED' && (
            <button
              onClick={() => onFlag(review.id)}
              title="Flag review"
              className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
          {review.status !== 'ARCHIVED' && (
            <button
              onClick={() => onArchive(review.id)}
              title="Archive review"
              className="p-1.5 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        {review.title && (
          <p className="text-sm font-semibold text-on-surface mb-1">&ldquo;{review.title}&rdquo;</p>
        )}
        <p className={`text-sm text-on-surface-variant leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
          {review.content}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-1 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Response */}
      {review.response ? (
        <div className="mx-5 mb-4 p-4 rounded-xl bg-surface-variant/30 border-s-2 border-secondary/40">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs font-semibold text-secondary">Your Response</span>
            {review.respondedAt && (
              <span className="text-[10px] text-on-surface-variant">{formatDate(review.respondedAt)}</span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{review.response}</p>
        </div>
      ) : (
        <div className="px-5 pb-4">
          {showReplyBox ? (
            <div className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-secondary/40 transition-colors resize-y"
              />
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAi(review)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Assist
                  </button>
                  <button
                    onClick={() => onOpenTemplates(review)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-variant/50 text-on-surface-variant text-xs font-medium hover:bg-surface-variant transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Templates
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowReplyBox(false); setReplyText(''); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!replyText.trim() || sending}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg gradient-accent text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {sending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {sending ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReplyBox(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <MessageSquare className="w-4 h-4" />
                Respond
              </button>
              <button
                onClick={() => onOpenAi(review)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors"
              >
                <Bot className="w-4 h-4" />
                AI Response
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
