import { Moon, Utensils, Brain, Thermometer, Smile } from 'lucide-react';

export const CATEGORIES = [
  { id: 'all', label: '전체', icon: Smile },
  { id: 'sleep', label: '수면/잠', icon: Moon },
  { id: 'feeding', label: '수유/이유식', icon: Utensils },
  { id: 'development', label: '발달/놀이', icon: Brain },
  { id: 'health', label: '건강/접종', icon: Thermometer },
];

export const GUIDE_DATA = [
  {
    id: 1,
    category: 'sleep',
    title: '통잠은 언제부터 잘까요?',
    content: '보통 생후 3~4개월이 되면 "수면 퇴행"이 오면서 패턴이 바뀝니다. 6개월 무렵부터는 밤에 6시간 이상 깨지 않고 자는 "통잠"이 가능해집니다. 낮과 밤을 구별해주는 수면 의식을 시작해보세요.',
    minMonth: 3,
    maxMonth: 12
  },
  {
    id: 2,
    category: 'feeding',
    title: '이유식 시작 시기가 궁금해요',
    content: '완분(분유) 아기는 만 4~6개월, 완모(모유) 아기는 만 6개월부터 시작하는 것을 권장합니다. 알레르기 반응을 확인하기 위해 쌀미음부터 시작하여 3일 간격으로 재료를 하나씩 추가하세요.',
    minMonth: 4,
    maxMonth: 7
  },
  {
    id: 3,
    category: 'health',
    title: '열이 날 때 대처법 (38도 이상)',
    content: '38도 미만이라면 미온수 마사지를 해주고, 38도 이상이면 해열제를 교차 복용할 수 있습니다. 단, 생후 3개월 미만 아기가 38도 이상이라면 즉시 응급실로 가야 합니다.',
    minMonth: 0,
    maxMonth: 36
  },
  {
    id: 4,
    category: 'development',
    title: '터미타임(Tummy Time) 하는 법',
    content: '신생아 시기부터 조금씩 엎어 놓는 연습을 하세요. 처음에는 보호자의 배 위에서 시작하다가, 익숙해지면 바닥에서 1~2분씩 늘려갑니다. 목과 등 근육 발달에 필수적입니다.',
    minMonth: 0,
    maxMonth: 4
  },
  {
    id: 5,
    category: 'sleep',
    title: '퍼버법 vs 안눕법? 수면교육 종류',
    content: '퍼버법은 울어도 정해진 시간만큼 기다리는 방법이고, 안눕법은 울면 안아주고 진정되면 다시 눕히는 방법입니다. 아이의 기질과 부모의 성향에 맞는 방법을 선택해 "일관성" 있게 유지하는 것이 핵심입니다.',
    minMonth: 3,
    maxMonth: 24
  },
];