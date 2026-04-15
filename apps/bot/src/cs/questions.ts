/**
 * 프론트엔드 CS 면접 질문/답변 데이터
 *
 * 카테고리: JavaScript, TypeScript, React, 브라우저, 네트워크, 성능최적화, 웹보안
 */

export type CSCategory =
  | "JavaScript"
  | "TypeScript"
  | "React"
  | "브라우저"
  | "네트워크"
  | "성능최적화"
  | "웹보안";

export interface CSQuestion {
  id: string;
  category: CSCategory;
  question: string;
  answer: string;
  keywords: string[];
}

export const CS_QUESTIONS: CSQuestion[] = [
  // ──────────────────────────────────────────
  // JavaScript
  // ──────────────────────────────────────────
  {
    id: "js_01",
    category: "JavaScript",
    question: "호이스팅(Hoisting)이란 무엇인가요?",
    answer:
      "호이스팅은 자바스크립트 엔진이 코드를 실행하기 전, 변수·함수 선언을 해당 스코프의 최상단으로 끌어올리는 동작입니다.\n\n" +
      "• `var` 선언은 호이스팅되며 `undefined`로 초기화됩니다.\n" +
      "• `let`, `const`도 호이스팅되지만 초기화 전까지는 TDZ(Temporal Dead Zone)에 놓여 참조하면 `ReferenceError`가 발생합니다.\n" +
      "• 함수 선언식(`function foo(){}`)은 함수 전체가 호이스팅되어 선언 전에도 호출이 가능합니다.\n" +
      "• 함수 표현식(`const foo = function(){}`)은 변수 선언만 호이스팅되어 선언 전 호출 시 오류가 납니다.",
    keywords: ["var", "let/const", "TDZ", "함수 선언식", "함수 표현식"],
  },
  {
    id: "js_02",
    category: "JavaScript",
    question: "클로저(Closure)란 무엇이며, 어떤 상황에서 활용하나요?",
    answer:
      "클로저는 함수가 자신이 선언된 렉시컬 환경(스코프)을 기억하여, 외부 함수가 종료된 뒤에도 외부 변수에 접근할 수 있는 함수입니다.\n\n" +
      "```js\n" +
      "function counter() {\n" +
      "  let count = 0;\n" +
      "  return () => ++count;\n" +
      "}\n" +
      "const inc = counter();\n" +
      "inc(); // 1\n" +
      "inc(); // 2\n" +
      "```\n\n" +
      "주요 활용 사례:\n" +
      "• 데이터 은닉 / 캡슐화\n" +
      "• 팩토리 함수로 상태를 가진 함수 생성\n" +
      "• React의 `useState`, `useCallback` 내부 구현\n" +
      "• 이벤트 핸들러에서 특정 값을 캡처",
    keywords: ["렉시컬 스코프", "외부 변수 참조", "데이터 은닉", "팩토리 함수"],
  },
  {
    id: "js_03",
    category: "JavaScript",
    question: "이벤트 루프(Event Loop)의 동작 방식을 설명해주세요.",
    answer:
      "자바스크립트는 싱글 스레드이지만 이벤트 루프를 통해 비동기 작업을 처리합니다.\n\n" +
      "1. 콜 스택(Call Stack): 현재 실행 중인 함수가 쌓이는 공간\n" +
      "2. Web APIs: `setTimeout`, `fetch` 등 비동기 작업을 브라우저/Node가 처리\n" +
      "3. 태스크 큐(Macrotask Queue): `setTimeout`, `setInterval` 콜백이 대기\n" +
      "4. 마이크로태스크 큐: `Promise.then`, `queueMicrotask` 콜백이 대기\n\n" +
      "이벤트 루프는 콜 스택이 비면 마이크로태스크 큐를 먼저 전부 비운 뒤, 태스크 큐에서 하나씩 꺼냅니다.\n\n" +
      "따라서 실행 순서: 동기 코드 → 마이크로태스크(Promise) → 태스크(setTimeout)",
    keywords: ["콜 스택", "마이크로태스크", "태스크 큐", "싱글 스레드", "Web APIs"],
  },
  {
    id: "js_04",
    category: "JavaScript",
    question: "실행 컨텍스트(Execution Context)란 무엇인가요?",
    answer:
      "실행 컨텍스트는 자바스크립트 코드가 실행되는 환경으로, 변수·함수·`this`에 대한 정보를 담고 있습니다.\n\n" +
      "구성 요소:\n" +
      "• 변수 환경(Variable Environment): var 선언, 함수 선언 저장\n" +
      "• 렉시컬 환경(Lexical Environment): let/const 선언, 외부 참조(스코프 체인)\n" +
      "• this 바인딩\n\n" +
      "종류:\n" +
      "• 전역 실행 컨텍스트: 처음 스크립트 실행 시 생성\n" +
      "• 함수 실행 컨텍스트: 함수 호출 시마다 생성되어 콜 스택에 쌓임\n" +
      "• eval 실행 컨텍스트\n\n" +
      "함수가 종료되면 컨텍스트가 스택에서 팝(pop)됩니다.",
    keywords: ["변수 환경", "렉시컬 환경", "스코프 체인", "this 바인딩", "콜 스택"],
  },
  {
    id: "js_05",
    category: "JavaScript",
    question: "var, let, const의 차이점은 무엇인가요?",
    answer:
      "| | var | let | const |\n" +
      "|---|---|---|---|\n" +
      "| 스코프 | 함수 | 블록 | 블록 |\n" +
      "| 호이스팅 | O (undefined 초기화) | O (TDZ) | O (TDZ) |\n" +
      "| 재선언 | O | X | X |\n" +
      "| 재할당 | O | O | X |\n" +
      "| 전역 객체 등록 | O | X | X |\n\n" +
      "`const`는 재할당이 불가능하지만 객체·배열의 내부 값은 변경할 수 있습니다. 불변성을 강제하려면 `Object.freeze()`를 사용합니다.\n\n" +
      "일반적으로 기본값으로 `const`를 사용하고, 재할당이 필요한 경우에만 `let`을 씁니다.",
    keywords: ["블록 스코프", "함수 스코프", "TDZ", "재선언", "재할당"],
  },
  {
    id: "js_06",
    category: "JavaScript",
    question: "Promise와 async/await의 차이점, 그리고 사용 시 주의사항을 설명해주세요.",
    answer:
      "`async/await`는 Promise를 기반으로 하는 문법적 설탕(Syntactic Sugar)입니다.\n\n" +
      "차이점:\n" +
      "• Promise 체이닝: `.then().catch()`로 연결 — 콜백이 중첩될수록 가독성 저하\n" +
      "• async/await: 동기 코드처럼 읽히는 비동기 처리, `try/catch`로 에러 처리\n\n" +
      "주의사항:\n" +
      "• `await`는 `async` 함수 안에서만 사용 가능\n" +
      "• 독립적인 비동기 작업을 순차적으로 `await`하면 불필요한 지연 발생 → `Promise.all()`로 병렬 처리\n" +
      "• `async` 함수는 항상 Promise를 반환\n" +
      "• 에러 처리를 빠뜨리면 Unhandled Promise Rejection 발생\n\n" +
      "```js\n" +
      "// 순차 (느림)\n" +
      "const a = await fetchA();\n" +
      "const b = await fetchB();\n\n" +
      "// 병렬 (빠름)\n" +
      "const [a, b] = await Promise.all([fetchA(), fetchB()]);\n" +
      "```",
    keywords: ["Promise", "async/await", "Promise.all", "에러 처리", "병렬 처리"],
  },
  {
    id: "js_07",
    category: "JavaScript",
    question: "프로토타입(Prototype)이란 무엇인가요?",
    answer:
      "자바스크립트의 모든 객체는 `[[Prototype]]`이라는 내부 슬롯을 통해 다른 객체를 참조합니다. 이것이 프로토타입입니다.\n\n" +
      "• 객체의 프로퍼티/메서드를 찾을 때, 해당 객체에 없으면 프로토타입 체인을 따라 상위 객체에서 탐색합니다.\n" +
      "• 모든 객체는 최종적으로 `Object.prototype`에 연결되며, 그 위는 `null`입니다.\n" +
      "• `class` 문법은 프로토타입 기반 상속의 문법적 설탕입니다.\n\n" +
      "```js\n" +
      "function Animal(name) { this.name = name; }\n" +
      "Animal.prototype.speak = function() { return `${this.name} speaks`; };\n\n" +
      "const dog = new Animal('Rex');\n" +
      "dog.speak(); // 'Rex speaks' — 프로토타입 체인으로 탐색\n" +
      "```",
    keywords: ["프로토타입 체인", "[[Prototype]]", "__proto__", "상속", "Object.prototype"],
  },
  {
    id: "js_08",
    category: "JavaScript",
    question: "얕은 복사(Shallow Copy)와 깊은 복사(Deep Copy)의 차이를 설명해주세요.",
    answer:
      "얕은 복사는 객체의 1단계 프로퍼티만 복사하며, 중첩 객체는 참조가 공유됩니다.\n" +
      "깊은 복사는 중첩 객체까지 완전히 새로운 값으로 복사합니다.\n\n" +
      "얕은 복사 방법:\n" +
      "• `Object.assign({}, obj)`\n" +
      "• 스프레드 연산자 `{ ...obj }`\n" +
      "• `Array.slice()`\n\n" +
      "깊은 복사 방법:\n" +
      "• `structuredClone(obj)` — 현대 브라우저/Node 지원, 함수·undefined는 제외\n" +
      "• `JSON.parse(JSON.stringify(obj))` — 함수·undefined·Date 객체 손실 주의\n" +
      "• lodash `_.cloneDeep()`\n\n" +
      "React에서 상태를 불변하게 업데이트할 때 얕은 복사로 새 참조를 생성하는 것이 일반적입니다.",
    keywords: ["참조 공유", "structuredClone", "불변성", "스프레드 연산자"],
  },
  {
    id: "js_09",
    category: "JavaScript",
    question: "이벤트 버블링, 캡처링, 위임(Delegation)을 설명해주세요.",
    answer:
      "이벤트 전파 3단계:\n" +
      "1. 캡처링: 이벤트가 window → 타깃 방향으로 전파\n" +
      "2. 타깃: 실제 이벤트 발생 요소에서 처리\n" +
      "3. 버블링: 이벤트가 타깃 → window 방향으로 전파\n\n" +
      "`addEventListener`의 세 번째 인자가 `true`면 캡처링, 기본값(`false`)은 버블링 단계에 등록됩니다.\n\n" +
      "이벤트 위임:\n" +
      "자식 요소마다 리스너를 붙이는 대신, 부모 요소에 하나만 등록해 `event.target`으로 판별하는 패턴입니다.\n\n" +
      "```js\n" +
      "ul.addEventListener('click', (e) => {\n" +
      "  if (e.target.tagName === 'LI') {\n" +
      "    console.log(e.target.textContent);\n" +
      "  }\n" +
      "});\n" +
      "```\n\n" +
      "장점: 메모리 절약, 동적으로 추가된 요소에도 자동 적용\n" +
      "`event.stopPropagation()`으로 버블링을 중단할 수 있습니다.",
    keywords: ["버블링", "캡처링", "이벤트 위임", "event.target", "stopPropagation"],
  },
  {
    id: "js_10",
    category: "JavaScript",
    question: "==와 ===의 차이, 그리고 타입 강제 변환(Type Coercion)이란?",
    answer:
      "`==` (느슨한 동등): 두 값을 비교할 때 타입이 다르면 자동으로 변환(강제 변환) 후 비교합니다.\n" +
      "`===` (엄격한 동등): 타입과 값이 모두 같아야 `true`를 반환합니다.\n\n" +
      "```js\n" +
      "0 == false   // true  (false → 0 변환)\n" +
      "0 === false  // false (타입 불일치)\n" +
      "'' == false  // true\n" +
      "null == undefined  // true\n" +
      "null === undefined // false\n" +
      "```\n\n" +
      "타입 강제 변환은 예측 불가능한 버그를 유발할 수 있으므로, 일반적으로 `===`와 `!==`를 사용하는 것을 권장합니다.\n\n" +
      "ESLint의 `eqeqeq` 규칙으로 `==` 사용을 자동 경고할 수 있습니다.",
    keywords: ["타입 강제 변환", "엄격한 동등", "느슨한 동등", "null/undefined"],
  },

  // ──────────────────────────────────────────
  // TypeScript
  // ──────────────────────────────────────────
  {
    id: "ts_01",
    category: "TypeScript",
    question: "type과 interface의 차이점은 무엇인가요?",
    answer:
      "공통점: 객체 타입 정의, 상속(extends), 구현(implements) 모두 가능\n\n" +
      "주요 차이점:\n" +
      "| | type | interface |\n" +
      "|---|---|---|\n" +
      "| 선언 병합 | X | O (같은 이름 재선언 시 자동 병합) |\n" +
      "| 유니온/인터섹션 | O | X |\n" +
      "| 계산된 프로퍼티 | O | 제한적 |\n" +
      "| 확장 방식 | `&` 인터섹션 | `extends` |\n\n" +
      "```ts\n" +
      "// interface만 가능: 선언 병합\n" +
      "interface User { name: string; }\n" +
      "interface User { age: number; } // 자동 병합\n\n" +
      "// type만 가능: 유니온\n" +
      "type ID = string | number;\n" +
      "```\n\n" +
      "일반적으로 공개 API나 라이브러리에는 `interface`(확장 가능), 유니온·복잡한 타입에는 `type`을 사용합니다.",
    keywords: ["선언 병합", "유니온 타입", "인터섹션 타입", "extends"],
  },
  {
    id: "ts_02",
    category: "TypeScript",
    question: "제네릭(Generic)이란 무엇이며, 왜 사용하나요?",
    answer:
      "제네릭은 타입을 파라미터로 받아 재사용 가능한 컴포넌트를 만드는 기능입니다.\n" +
      "`any`와 달리 타입 안정성을 유지하면서 다양한 타입에 대응할 수 있습니다.\n\n" +
      "```ts\n" +
      "function identity<T>(arg: T): T {\n" +
      "  return arg;\n" +
      "}\n\n" +
      "// 제네릭 제약\n" +
      "function getLength<T extends { length: number }>(arg: T): number {\n" +
      "  return arg.length;\n" +
      "}\n\n" +
      "// 제네릭 인터페이스\n" +
      "interface ApiResponse<T> {\n" +
      "  data: T;\n" +
      "  status: number;\n" +
      "}\n" +
      "```\n\n" +
      "React에서는 `useState<User | null>(null)`, `useRef<HTMLInputElement>(null)` 등에 활용됩니다.",
    keywords: ["타입 파라미터", "타입 안정성", "제네릭 제약", "재사용성"],
  },
  {
    id: "ts_03",
    category: "TypeScript",
    question: "자주 쓰는 유틸리티 타입을 설명해주세요. (Partial, Required, Pick, Omit, Readonly 등)",
    answer:
      "TypeScript 내장 유틸리티 타입:\n\n" +
      "• `Partial<T>`: 모든 프로퍼티를 선택적으로 — 업데이트 DTO에 활용\n" +
      "• `Required<T>`: 모든 프로퍼티를 필수로\n" +
      "• `Readonly<T>`: 모든 프로퍼티를 읽기 전용으로\n" +
      "• `Pick<T, K>`: 특정 프로퍼티만 선택\n" +
      "• `Omit<T, K>`: 특정 프로퍼티 제외\n" +
      "• `Record<K, V>`: 키-값 타입 매핑\n" +
      "• `Exclude<T, U>`: 유니온에서 특정 타입 제거\n" +
      "• `Extract<T, U>`: 유니온에서 특정 타입만 추출\n" +
      "• `NonNullable<T>`: null/undefined 제거\n" +
      "• `ReturnType<T>`: 함수의 반환 타입 추출\n\n" +
      "```ts\n" +
      "type User = { id: number; name: string; email: string; };\n\n" +
      "type UserPreview = Pick<User, 'id' | 'name'>;\n" +
      "type UserWithoutId = Omit<User, 'id'>;\n" +
      "type UpdateUser = Partial<UserWithoutId>;\n" +
      "```",
    keywords: ["Partial", "Omit", "Pick", "Record", "ReturnType"],
  },
  {
    id: "ts_04",
    category: "TypeScript",
    question: "타입 가드(Type Guard)란 무엇인가요?",
    answer:
      "타입 가드는 런타임에 특정 타입을 확인하여 이후 코드 블록에서 타입을 좁히는(narrow) 기법입니다.\n\n" +
      "종류:\n" +
      "• `typeof`: 기본 타입 확인\n" +
      "• `instanceof`: 클래스 인스턴스 확인\n" +
      "• `in`: 프로퍼티 존재 확인\n" +
      "• 사용자 정의 타입 가드: `is` 키워드\n\n" +
      "```ts\n" +
      "// 사용자 정의 타입 가드\n" +
      "function isUser(obj: unknown): obj is User {\n" +
      "  return typeof obj === 'object' && obj !== null && 'name' in obj;\n" +
      "}\n\n" +
      "// 판별 유니온(Discriminated Union)\n" +
      "type Shape =\n" +
      "  | { kind: 'circle'; radius: number }\n" +
      "  | { kind: 'rect'; width: number; height: number };\n\n" +
      "function area(s: Shape) {\n" +
      "  if (s.kind === 'circle') return Math.PI * s.radius ** 2;\n" +
      "  return s.width * s.height;\n" +
      "}\n" +
      "```",
    keywords: ["타입 좁히기", "typeof", "instanceof", "is 키워드", "판별 유니온"],
  },
  {
    id: "ts_05",
    category: "TypeScript",
    question: "any, unknown, never의 차이를 설명해주세요.",
    answer:
      "• `any`: 모든 타입 허용, 타입 검사 비활성화. 남용 시 TypeScript 사용 이점 소멸\n" +
      "• `unknown`: `any`와 유사하지만 사용 전에 타입을 좁혀야 함. 안전한 `any`\n" +
      "• `never`: 절대 발생하지 않는 값의 타입. 함수가 항상 예외를 던지거나 무한 루프일 때\n\n" +
      "```ts\n" +
      "// unknown — 사용 전 타입 확인 강제\n" +
      "function parse(input: unknown) {\n" +
      "  if (typeof input === 'string') return input.toUpperCase(); // OK\n" +
      "  // input.toUpperCase() → 오류\n" +
      "}\n\n" +
      "// never — 완전성 검사(Exhaustiveness Check)\n" +
      "function assertNever(x: never): never {\n" +
      "  throw new Error('Unexpected: ' + x);\n" +
      "}\n" +
      "```\n\n" +
      "일반적으로 `any` 대신 `unknown`을 사용하고, switch 완전성 검사에 `never`를 활용합니다.",
    keywords: ["any", "unknown", "never", "타입 안정성", "완전성 검사"],
  },
  {
    id: "ts_06",
    category: "TypeScript",
    question: "인터섹션 타입(&)과 유니온 타입(|)의 차이는 무엇인가요?",
    answer:
      "• 유니온 타입(`|`): A 또는 B — 두 타입 중 하나를 만족하면 됩니다.\n" +
      "• 인터섹션 타입(`&`): A 이면서 B — 두 타입의 모든 프로퍼티를 가져야 합니다.\n\n" +
      "```ts\n" +
      "type A = { name: string };\n" +
      "type B = { age: number };\n\n" +
      "type AorB = A | B;  // name 또는 age 중 하나만 있어도 됨\n" +
      "type AandB = A & B; // name과 age 모두 있어야 함\n\n" +
      "// 유니온: 공통 프로퍼티만 바로 접근 가능\n" +
      "function greet(person: AorB) {\n" +
      "  // person.name → 오류 (B에는 없을 수도 있음)\n" +
      "  if ('name' in person) console.log(person.name);\n" +
      "}\n" +
      "```\n\n" +
      "인터섹션은 믹스인 패턴이나 여러 인터페이스를 합칠 때 활용합니다.",
    keywords: ["유니온", "인터섹션", "타입 병합", "믹스인"],
  },

  // ──────────────────────────────────────────
  // React
  // ──────────────────────────────────────────
  {
    id: "react_01",
    category: "React",
    question: "Virtual DOM이란 무엇이며, 왜 사용하나요?",
    answer:
      "Virtual DOM은 실제 DOM의 가벼운 JavaScript 객체 복사본입니다.\n\n" +
      "동작 방식:\n" +
      "1. 상태 변경 시 새 Virtual DOM 트리 생성\n" +
      "2. 이전 Virtual DOM과 비교(Diffing)\n" +
      "3. 변경된 부분만 실제 DOM에 적용(Reconciliation)\n\n" +
      "장점:\n" +
      "• 실제 DOM 조작은 비용이 큰데, 변경된 부분만 업데이트해 성능 개선\n" +
      "• 선언형 UI 작성 가능 (어떻게 바꿀지가 아닌 어떤 상태인지만 기술)\n\n" +
      "주의: Virtual DOM 자체가 실제 DOM보다 항상 빠른 것은 아닙니다. 복잡한 UI에서 변경이 잦을 때 효과적입니다.\n\n" +
      "React 18의 Fiber 아키텍처는 재조정 작업을 작은 단위로 나눠 우선순위를 부여하여 응답성을 향상시킵니다.",
    keywords: ["Diffing", "Reconciliation", "Fiber", "선언형 UI"],
  },
  {
    id: "react_02",
    category: "React",
    question: "React Hooks의 규칙(Rules of Hooks)을 설명해주세요.",
    answer:
      "React Hooks를 사용할 때 반드시 지켜야 하는 두 가지 규칙:\n\n" +
      "1. 최상위에서만 호출: 반복문, 조건문, 중첩 함수 안에서 Hook을 호출하지 않습니다.\n" +
      "   → Hook은 호출 순서로 상태를 추적하기 때문에, 순서가 바뀌면 버그 발생\n\n" +
      "2. React 함수 컴포넌트 또는 커스텀 Hook에서만 호출: 일반 JavaScript 함수에서는 사용 불가\n\n" +
      "```tsx\n" +
      "// 잘못된 예\n" +
      "if (condition) {\n" +
      "  const [state, setState] = useState(false); // 규칙 위반!\n" +
      "}\n\n" +
      "// 올바른 예 — 조건은 Hook 안으로\n" +
      "const [state, setState] = useState(false);\n" +
      "useEffect(() => {\n" +
      "  if (condition) { /* ... */ }\n" +
      "}, [condition]);\n" +
      "```\n\n" +
      "`eslint-plugin-react-hooks`의 `rules-of-hooks` 규칙으로 자동 검사할 수 있습니다.",
    keywords: ["Hook 호출 순서", "최상위 호출", "eslint-plugin-react-hooks"],
  },
  {
    id: "react_03",
    category: "React",
    question: "useState와 useReducer의 차이 및 각각 어떤 상황에서 사용하나요?",
    answer:
      "`useState`: 단순한 값(boolean, string, 독립적 number)에 적합\n" +
      "`useReducer`: 복잡한 상태 로직, 여러 하위 값을 가진 상태, 이전 상태에 의존하는 업데이트에 적합\n\n" +
      "```tsx\n" +
      "// useReducer 예시\n" +
      "type State = { count: number; step: number };\n" +
      "type Action = { type: 'increment' } | { type: 'setStep'; step: number };\n\n" +
      "function reducer(state: State, action: Action): State {\n" +
      "  switch (action.type) {\n" +
      "    case 'increment': return { ...state, count: state.count + state.step };\n" +
      "    case 'setStep': return { ...state, step: action.step };\n" +
      "  }\n" +
      "}\n" +
      "```\n\n" +
      "useReducer 선택 기준:\n" +
      "• 상태 전환 로직이 복잡하거나 다른 상태에 의존할 때\n" +
      "• 상태 업데이트 로직을 컴포넌트 밖으로 분리하고 싶을 때\n" +
      "• 테스트가 필요한 상태 로직일 때 (reducer는 순수 함수)\n" +
      "• Redux 없이 컴포넌트 내 복잡한 상태 관리가 필요할 때",
    keywords: ["상태 관리", "reducer 순수 함수", "dispatch", "action"],
  },
  {
    id: "react_04",
    category: "React",
    question: "useEffect의 클린업(cleanup) 함수는 언제 실행되나요?",
    answer:
      "클린업 함수는 `useEffect`의 콜백에서 반환하는 함수로, 두 가지 시점에 실행됩니다:\n\n" +
      "1. 컴포넌트 언마운트 시\n" +
      "2. 의존성 배열의 값이 변경되어 effect가 재실행되기 전\n\n" +
      "```tsx\n" +
      "useEffect(() => {\n" +
      "  const timer = setInterval(() => console.log('tick'), 1000);\n\n" +
      "  return () => {\n" +
      "    clearInterval(timer); // 클린업: 언마운트 또는 재실행 전에 호출\n" +
      "  };\n" +
      "}, []);\n" +
      "```\n\n" +
      "클린업이 필요한 경우:\n" +
      "• `setInterval`, `setTimeout` 해제\n" +
      "• 이벤트 리스너 제거\n" +
      "• WebSocket, AbortController 연결 해제\n" +
      "• 구독(subscription) 해제\n\n" +
      "클린업을 빠뜨리면 메모리 누수(Memory Leak)가 발생할 수 있습니다. React 18 Strict Mode에서는 개발 환경에서 effect를 두 번 실행하여 클린업 누락을 감지합니다.",
    keywords: ["클린업", "언마운트", "메모리 누수", "의존성 배열", "Strict Mode"],
  },
  {
    id: "react_05",
    category: "React",
    question: "useMemo와 useCallback의 차이와 사용 시 주의사항을 설명해주세요.",
    answer:
      "• `useMemo`: 계산 결과값을 메모이제이션\n" +
      "• `useCallback`: 함수 자체를 메모이제이션 (`useMemo(() => fn, deps)`와 동일)\n\n" +
      "```tsx\n" +
      "const expensiveValue = useMemo(\n" +
      "  () => computeExpensive(data),\n" +
      "  [data]\n" +
      ");\n\n" +
      "const handleClick = useCallback(\n" +
      "  () => onSubmit(id),\n" +
      "  [id, onSubmit]\n" +
      ");\n" +
      "```\n\n" +
      "주의사항:\n" +
      "• 모든 값/함수에 적용하면 오히려 성능 저하 (메모이제이션 자체도 비용)\n" +
      "• `React.memo`로 감싼 자식 컴포넌트에 props로 전달하는 함수/값에 효과적\n" +
      "• 의존성 배열 관리를 잘못하면 오래된 값(stale closure) 참조 버그 발생\n" +
      "• 먼저 프로파일링으로 병목을 확인한 후 적용하는 것을 권장",
    keywords: ["메모이제이션", "React.memo", "불필요한 재렌더링", "stale closure"],
  },
  {
    id: "react_06",
    category: "React",
    question: "React.memo란 무엇이며, 언제 사용하나요?",
    answer:
      "`React.memo`는 컴포넌트를 감싸 props가 변경되지 않으면 리렌더링을 건너뛰는 고차 컴포넌트(HOC)입니다. 클래스 컴포넌트의 `PureComponent`에 해당합니다.\n\n" +
      "```tsx\n" +
      "const Button = React.memo(({ onClick, label }: Props) => {\n" +
      "  console.log('render');\n" +
      "  return <button onClick={onClick}>{label}</button>;\n" +
      "});\n\n" +
      "// 부모가 리렌더링돼도 onClick/label이 같으면 Button은 리렌더링 안 함\n" +
      "```\n\n" +
      "효과적인 사용 조건:\n" +
      "• 렌더링 비용이 크고, 부모가 자주 리렌더링되는 경우\n" +
      "• 동일한 props로 같은 결과를 반환하는 순수 컴포넌트\n\n" +
      "주의: props가 객체/함수인 경우 매 렌더마다 새 참조가 생성되므로, `useCallback`/`useMemo`와 함께 사용해야 효과가 있습니다.",
    keywords: ["고차 컴포넌트", "props 비교", "얕은 비교", "PureComponent"],
  },
  {
    id: "react_07",
    category: "React",
    question: "key prop은 왜 필요하며, index를 key로 사용하면 안 되는 이유는?",
    answer:
      "`key`는 React가 리스트에서 어떤 항목이 변경·추가·삭제됐는지 식별하기 위해 사용합니다.\n\n" +
      "index를 key로 쓰면 안 되는 이유:\n" +
      "항목 순서가 바뀌거나 중간에 삽입·삭제될 때, index가 바뀌어 이전 컴포넌트의 상태가 잘못된 항목에 연결될 수 있습니다.\n\n" +
      "```tsx\n" +
      "// 나쁜 예\n" +
      "items.map((item, i) => <Item key={i} {...item} />)\n\n" +
      "// 좋은 예 — 고유하고 안정적인 ID 사용\n" +
      "items.map((item) => <Item key={item.id} {...item} />)\n" +
      "```\n\n" +
      "index를 사용해도 되는 경우:\n" +
      "• 리스트가 정적이고 순서가 변경되지 않을 때\n" +
      "• 항목에 고유 ID가 없고 재정렬도 없는 경우",
    keywords: ["리스트 렌더링", "Reconciliation", "고유 ID", "컴포넌트 상태 유지"],
  },
  {
    id: "react_08",
    category: "React",
    question: "Context API는 언제 쓰고, 외부 상태관리 라이브러리(Zustand, Jotai 등)는 언제 선택하나요?",
    answer:
      "Context API:\n" +
      "• prop drilling 방지 (테마, 언어, 로그인 유저 정보 등 전역 설정)\n" +
      "• 변경이 잦지 않은 데이터에 적합\n" +
      "• Context 값이 바뀌면 해당 Context를 구독하는 모든 컴포넌트가 리렌더링됨\n\n" +
      "외부 라이브러리를 선택하는 기준:\n" +
      "• 상태가 자주 바뀌어 불필요한 리렌더링이 발생할 때\n" +
      "• 여러 컴포넌트 간 파생 상태(derived state)가 복잡할 때\n" +
      "• 디버깅 도구, 미들웨어, 스냅샷 기능이 필요할 때\n\n" +
      "라이브러리별 특징:\n" +
      "• Zustand: 가볍고 보일러플레이트가 적음\n" +
      "• Jotai: 원자(atom) 기반, 파생 상태 관리에 강점\n" +
      "• Recoil: atom + selector 모델, 비동기 상태 처리 내장\n" +
      "• Redux Toolkit: 대규모 팀, 복잡한 비즈니스 로직에 적합",
    keywords: ["prop drilling", "리렌더링 최적화", "Zustand", "전역 상태"],
  },
  {
    id: "react_09",
    category: "React",
    question: "React 18에서 추가된 주요 기능을 설명해주세요.",
    answer:
      "1. Concurrent Mode (동시성 렌더링)\n" +
      "   • 렌더링 작업을 중단하고 우선순위가 높은 작업을 먼저 처리\n" +
      "   • 긴 렌더링 중에도 UI가 응답 가능\n\n" +
      "2. `useTransition` / `useDeferredValue`\n" +
      "   • 긴급하지 않은 상태 업데이트를 낮은 우선순위로 처리\n" +
      "   • 검색 입력 중 목록 업데이트를 지연시켜 UX 개선\n\n" +
      "3. Automatic Batching\n" +
      "   • 이전: 이벤트 핸들러 내 상태 업데이트만 배치 처리\n" +
      "   • 이후: `setTimeout`, `Promise.then` 안에서도 자동 배치\n\n" +
      "4. Suspense 개선\n" +
      "   • 서버 사이드 렌더링에서도 Suspense 지원\n\n" +
      "5. `createRoot` API\n" +
      "   • `ReactDOM.render` 대신 `createRoot(container).render(<App />)` 사용",
    keywords: ["Concurrent Mode", "useTransition", "Automatic Batching", "Suspense", "createRoot"],
  },
  {
    id: "react_10",
    category: "React",
    question: "커스텀 Hook을 만드는 이유와 원칙을 설명해주세요.",
    answer:
      "커스텀 Hook은 컴포넌트 간 상태 로직을 재사용하기 위해 만듭니다.\n" +
      "이름은 반드시 `use`로 시작해야 합니다(Hooks 규칙 적용을 위해).\n\n" +
      "```tsx\n" +
      "function useFetch<T>(url: string) {\n" +
      "  const [data, setData] = useState<T | null>(null);\n" +
      "  const [loading, setLoading] = useState(true);\n" +
      "  const [error, setError] = useState<Error | null>(null);\n\n" +
      "  useEffect(() => {\n" +
      "    fetch(url)\n" +
      "      .then(r => r.json())\n" +
      "      .then(setData)\n" +
      "      .catch(setError)\n" +
      "      .finally(() => setLoading(false));\n" +
      "  }, [url]);\n\n" +
      "  return { data, loading, error };\n" +
      "}\n" +
      "```\n\n" +
      "원칙:\n" +
      "• 컴포넌트 렌더링 로직이 아닌 상태/사이드 이펙트 로직만 추출\n" +
      "• 단일 책임 — 하나의 관심사만 다룸\n" +
      "• Hook 끼리 조합 가능 (Hook 합성)\n" +
      "• UI와 비즈니스 로직 분리로 테스트 용이",
    keywords: ["로직 재사용", "use 접두사", "관심사 분리", "Hook 합성"],
  },

  // ──────────────────────────────────────────
  // 브라우저
  // ──────────────────────────────────────────
  {
    id: "browser_01",
    category: "브라우저",
    question: "브라우저 렌더링 과정(Critical Rendering Path)을 설명해주세요.",
    answer:
      "1. HTML 파싱 → DOM 트리 생성\n" +
      "2. CSS 파싱 → CSSOM 트리 생성\n" +
      "3. DOM + CSSOM → 렌더 트리(Render Tree) 생성 (display:none 제외)\n" +
      "4. 레이아웃(Layout/Reflow): 요소의 위치와 크기 계산\n" +
      "5. 페인트(Paint): 실제 픽셀로 그리기\n" +
      "6. 합성(Composite): 레이어를 합쳐 화면에 표시\n\n" +
      "최적화 포인트:\n" +
      "• `<script>` 태그는 HTML 파싱을 차단 → `defer` 또는 `async` 속성 사용\n" +
      "• CSS는 렌더링 차단 리소스 → 크리티컬 CSS 인라인 처리\n" +
      "• 레이아웃을 유발하는 JS 쿼리(`offsetWidth`, `scrollTop`)를 배치 처리\n" +
      "• `will-change`, `transform`으로 레이어 분리하여 Composite 단계만 유발",
    keywords: ["DOM", "CSSOM", "렌더 트리", "레이아웃", "페인트", "합성"],
  },
  {
    id: "browser_02",
    category: "브라우저",
    question: "리플로우(Reflow)와 리페인트(Repaint)의 차이와 최소화 방법을 설명해주세요.",
    answer:
      "• 리플로우: 요소의 크기나 위치가 변경되어 레이아웃을 다시 계산하는 과정. 비용이 매우 큼\n" +
      "• 리페인트: 레이아웃은 바뀌지 않고 색상·배경 등 시각적 속성만 변경되는 과정. 리플로우보다 가벼움\n\n" +
      "리플로우 유발: `width`, `height`, `margin`, `padding`, `font-size`, DOM 삽입/삭제, `offsetWidth` 읽기\n" +
      "리페인트만 유발: `color`, `background-color`, `visibility`\n" +
      "둘 다 유발 안 함: `transform`, `opacity` (Composite 레이어에서 처리)\n\n" +
      "최소화 방법:\n" +
      "• CSS 클래스를 한 번에 변경 (`classList` 사용)\n" +
      "• DOM을 DocumentFragment나 display:none 처리 후 일괄 변경\n" +
      "• 애니메이션은 `transform`/`opacity` 사용\n" +
      "• 레이아웃 값 읽기와 쓰기를 분리 (레이아웃 스래싱 방지)",
    keywords: ["레이아웃", "합성", "transform", "레이아웃 스래싱", "GPU 가속"],
  },
  {
    id: "browser_03",
    category: "브라우저",
    question: "쿠키, 세션스토리지, 로컬스토리지의 차이를 설명해주세요.",
    answer:
      "| | 쿠키 | 세션스토리지 | 로컬스토리지 |\n" +
      "|---|---|---|---|\n" +
      "| 만료 | 직접 설정 | 탭 닫으면 삭제 | 명시적 삭제 전 유지 |\n" +
      "| 크기 | ~4KB | ~5MB | ~5MB |\n" +
      "| 서버 전송 | O (요청마다 자동) | X | X |\n" +
      "| 접근 범위 | 도메인/경로 설정 | 같은 탭만 | 같은 출처 |\n\n" +
      "사용 사례:\n" +
      "• 쿠키: 인증 토큰(HttpOnly 설정), 트래킹, 서버가 알아야 하는 설정\n" +
      "• 세션스토리지: 페이지 새로고침 시 유지, 탭 닫으면 사라져도 되는 임시 데이터\n" +
      "• 로컬스토리지: 다크모드 설정, 장바구니, 로그인 상태 유지\n\n" +
      "보안 주의:\n" +
      "• 로컬스토리지/세션스토리지는 JS로 접근 가능 → XSS에 취약하므로 민감 정보 저장 금지\n" +
      "• 인증 토큰은 HttpOnly 쿠키에 저장하는 것이 안전",
    keywords: ["HttpOnly", "만료 시간", "XSS 취약점", "출처(Origin)"],
  },
  {
    id: "browser_04",
    category: "브라우저",
    question: "CORS(Cross-Origin Resource Sharing)란 무엇인가요?",
    answer:
      "CORS는 브라우저가 다른 출처(Origin)의 리소스 요청을 제한하는 보안 정책입니다.\n" +
      "출처는 `프로토콜 + 도메인 + 포트`의 조합입니다.\n\n" +
      "동작 방식:\n" +
      "• 단순 요청(GET, 기본 POST): 브라우저가 요청 헤더에 `Origin`을 포함하여 전송\n" +
      "• 서버가 응답에 `Access-Control-Allow-Origin: *` 또는 허용 출처를 포함하면 허용\n\n" +
      "프리플라이트(Preflight):\n" +
      "• `PUT`, `DELETE`, `Content-Type: application/json` 등의 요청 전, OPTIONS 요청을 먼저 보내 서버가 허용하는지 확인\n\n" +
      "해결 방법:\n" +
      "• 서버에서 `Access-Control-Allow-Origin` 헤더 설정 (가장 정석)\n" +
      "• 개발 환경: 프록시 설정 (Vite: `server.proxy`, Next.js: `rewrites`)\n" +
      "• 클라이언트 측에서는 해결 불가",
    keywords: ["동일 출처 정책", "프리플라이트", "Access-Control-Allow-Origin", "프록시"],
  },
  {
    id: "browser_05",
    category: "브라우저",
    question: "CSR, SSR, SSG의 차이와 각각의 장단점을 설명해주세요.",
    answer:
      "CSR (Client-Side Rendering):\n" +
      "• 브라우저가 빈 HTML을 받아 JS로 화면을 구성\n" +
      "• 장점: 빠른 페이지 전환, 풍부한 인터랙션\n" +
      "• 단점: 초기 로딩 느림, SEO 불리\n\n" +
      "SSR (Server-Side Rendering):\n" +
      "• 서버가 요청마다 완성된 HTML 반환\n" +
      "• 장점: 빠른 초기 FCP, SEO 유리, 항상 최신 데이터\n" +
      "• 단점: 서버 부하, TTFB 증가\n\n" +
      "SSG (Static Site Generation):\n" +
      "• 빌드 시점에 HTML을 미리 생성, CDN 배포\n" +
      "• 장점: 가장 빠른 TTFB, 서버 불필요, SEO 최적\n" +
      "• 단점: 실시간 데이터 반영 불가\n\n" +
      "ISR (Incremental Static Regeneration, Next.js):\n" +
      "• SSG + 특정 주기로 재생성 — 정적 성능 + 데이터 최신성 절충\n\n" +
      "선택 기준: 블로그/마케팅 → SSG, 뉴스/상품 목록 → ISR, 대시보드/개인화 → SSR/CSR",
    keywords: ["FCP", "TTFB", "SEO", "ISR", "CDN"],
  },
  {
    id: "browser_06",
    category: "브라우저",
    question: "`<script>` 태그의 defer와 async 속성 차이를 설명해주세요.",
    answer:
      "기본 `<script>`: HTML 파싱 중단 → JS 다운로드 및 실행 → 파싱 재개\n\n" +
      "• `async`: 다운로드는 병렬, 완료 즉시 실행 (HTML 파싱 일시 중단)\n" +
      "  → 실행 순서 보장 없음. 독립적인 서드파티 스크립트에 적합 (광고, 분석 도구)\n\n" +
      "• `defer`: 다운로드는 병렬, HTML 파싱 완료 후 순서대로 실행\n" +
      "  → 실행 순서 보장. DOM 접근이 필요한 스크립트에 적합. 모던 앱의 기본 권장\n\n" +
      "```html\n" +
      "<script src=\"analytics.js\" async></script>  <!-- 순서 무관한 독립 스크립트 -->\n" +
      "<script src=\"app.js\" defer></script>          <!-- DOM 필요, 순서 중요 -->\n" +
      "```\n\n" +
      "type=\"module\"인 스크립트는 기본적으로 defer처럼 동작합니다.",
    keywords: ["HTML 파싱 차단", "defer", "async", "DOMContentLoaded", "type=module"],
  },
  {
    id: "browser_07",
    category: "브라우저",
    question: "브라우저 주소창에 URL을 입력하면 어떤 일이 일어나나요?",
    answer:
      "1. URL 파싱: 브라우저가 프로토콜, 도메인, 경로, 쿼리 파라미터 분석\n" +
      "2. DNS 조회: 도메인 → IP 주소 변환 (로컬 캐시 → OS 캐시 → DNS 서버 순서로 탐색)\n" +
      "3. TCP 연결: 서버와 3-way handshake (SYN → SYN-ACK → ACK)\n" +
      "4. TLS 핸드셰이크: HTTPS인 경우 인증서 확인 및 암호화 키 교환\n" +
      "5. HTTP 요청 전송: 브라우저가 GET 요청 전송\n" +
      "6. 서버 응답: HTML, 상태 코드, 헤더 반환\n" +
      "7. 브라우저 렌더링: HTML 파싱 → CSS/JS 로드 → DOM/CSSOM → 화면 표시\n" +
      "8. 추가 리소스 로드: HTML 파싱 중 발견된 이미지, CSS, JS를 병렬 요청\n\n" +
      "HTTP/2에서는 단일 TCP 연결에서 멀티플렉싱으로 여러 리소스를 동시 전송합니다.",
    keywords: ["DNS", "TCP/IP", "TLS", "HTTP", "렌더링 파이프라인"],
  },
  {
    id: "browser_08",
    category: "브라우저",
    question: "웹 접근성(Accessibility)이란 무엇이며, 프론트엔드 개발에서 어떻게 적용하나요?",
    answer:
      "웹 접근성은 장애가 있는 사용자를 포함한 모든 사람이 웹을 이용할 수 있도록 하는 것입니다.\n\n" +
      "주요 적용 방법:\n" +
      "• 시맨틱 HTML: `<button>`, `<nav>`, `<main>` 등 의미 있는 태그 사용\n" +
      "• ARIA 속성: `aria-label`, `aria-expanded`, `role` 등으로 스크린 리더에 정보 제공\n" +
      "• 키보드 네비게이션: Tab 순서, `focus` 스타일, `onKeyDown` 핸들러\n" +
      "• 색상 대비: WCAG 기준 최소 4.5:1 대비율\n" +
      "• 이미지 대체 텍스트: `alt` 속성 (장식용 이미지는 `alt=\"\"`)\n" +
      "• 포커스 관리: 모달 오픈 시 포커스 이동, 닫기 시 원래 요소로 복귀\n\n" +
      "```tsx\n" +
      "<button\n" +
      "  aria-expanded={isOpen}\n" +
      "  aria-controls=\"menu\"\n" +
      "  onClick={toggleMenu}\n" +
      ">\n" +
      "  메뉴 {isOpen ? '닫기' : '열기'}\n" +
      "</button>\n" +
      "```",
    keywords: ["WCAG", "ARIA", "시맨틱 HTML", "스크린 리더", "키보드 네비게이션"],
  },

  // ──────────────────────────────────────────
  // 네트워크
  // ──────────────────────────────────────────
  {
    id: "net_01",
    category: "네트워크",
    question: "HTTP와 HTTPS의 차이를 설명해주세요.",
    answer:
      "HTTP(HyperText Transfer Protocol)는 평문으로 데이터를 전송합니다.\n" +
      "HTTPS는 HTTP에 TLS(Transport Layer Security) 암호화 레이어를 추가합니다.\n\n" +
      "HTTPS의 보장:\n" +
      "• 기밀성: 데이터 암호화로 중간자 도청 방지\n" +
      "• 무결성: 전송 중 데이터 변조 감지\n" +
      "• 인증: SSL/TLS 인증서로 서버 신원 확인\n\n" +
      "TLS 핸드셰이크 과정:\n" +
      "1. 클라이언트 → 서버: 지원 암호화 방식 목록(Client Hello)\n" +
      "2. 서버 → 클라이언트: 선택한 방식 + 인증서(Server Hello)\n" +
      "3. 인증서 검증 → 세션 키 교환\n" +
      "4. 대칭 키로 이후 통신 암호화\n\n" +
      "현재 TLS 1.3이 표준이며, TLS 1.0/1.1은 취약점으로 사용 중단 권고됩니다.",
    keywords: ["TLS", "암호화", "인증서", "중간자 공격", "핸드셰이크"],
  },
  {
    id: "net_02",
    category: "네트워크",
    question: "HTTP/1.1, HTTP/2, HTTP/3의 차이를 설명해주세요.",
    answer:
      "HTTP/1.1:\n" +
      "• 기본 Keep-Alive로 TCP 연결 재사용\n" +
      "• HOL(Head-of-Line) Blocking: 앞 요청이 완료돼야 다음 처리\n" +
      "• 파이프라이닝은 있지만 실용성 낮음\n\n" +
      "HTTP/2:\n" +
      "• 멀티플렉싱: 단일 TCP 연결에서 여러 스트림 동시 처리 → HOL Blocking 해소\n" +
      "• 헤더 압축(HPACK)\n" +
      "• 서버 푸시: 클라이언트 요청 전 리소스를 미리 전송\n" +
      "• 바이너리 프레이밍\n\n" +
      "HTTP/3:\n" +
      "• TCP 대신 QUIC(UDP 기반) 사용\n" +
      "• TCP 수준 HOL Blocking 완전 해소\n" +
      "• 연결 설정 시간 단축 (0-RTT)\n" +
      "• 네트워크 전환 시에도 연결 유지(Connection Migration)\n\n" +
      "현재 HTTP/2가 대부분의 주요 사이트에서 사용 중이며, HTTP/3 도입도 증가 중입니다.",
    keywords: ["멀티플렉싱", "HOL Blocking", "QUIC", "헤더 압축", "서버 푸시"],
  },
  {
    id: "net_03",
    category: "네트워크",
    question: "REST API란 무엇이며, RESTful 설계 원칙을 설명해주세요.",
    answer:
      "REST(Representational State Transfer)는 HTTP를 활용한 아키텍처 스타일입니다.\n\n" +
      "6가지 제약 조건:\n" +
      "1. 클라이언트-서버 분리\n" +
      "2. 무상태(Stateless): 각 요청은 필요한 정보를 모두 포함\n" +
      "3. 캐시 가능\n" +
      "4. 균일한 인터페이스: 리소스 중심 URL, HTTP 메서드로 행위 표현\n" +
      "5. 계층형 시스템\n" +
      "6. 코드 온 디맨드 (선택적)\n\n" +
      "RESTful URL 설계:\n" +
      "```\n" +
      "GET    /users          # 목록 조회\n" +
      "GET    /users/:id      # 단건 조회\n" +
      "POST   /users          # 생성\n" +
      "PUT    /users/:id      # 전체 수정\n" +
      "PATCH  /users/:id      # 부분 수정\n" +
      "DELETE /users/:id      # 삭제\n" +
      "```\n\n" +
      "URL에 동사 사용 금지, 명사(리소스)를 복수형으로, 상태 코드를 의미 있게 사용합니다.",
    keywords: ["무상태", "HTTP 메서드", "리소스 중심", "상태 코드", "균일한 인터페이스"],
  },
  {
    id: "net_04",
    category: "네트워크",
    question: "브라우저 캐시와 Cache-Control 헤더를 설명해주세요.",
    answer:
      "Cache-Control 주요 지시어:\n" +
      "• `no-store`: 캐시 완전 금지\n" +
      "• `no-cache`: 캐시 저장은 하되, 매번 서버에 유효성 검증 필요\n" +
      "• `max-age=N`: N초 동안 캐시 유효\n" +
      "• `public`: CDN 등 공유 캐시에 저장 허용\n" +
      "• `private`: 브라우저 개인 캐시에만 저장 (로그인 페이지 등)\n\n" +
      "유효성 검증(Conditional Requests):\n" +
      "• `ETag`: 리소스 해시값. `If-None-Match` 헤더로 비교 → 변경 없으면 304 반환\n" +
      "• `Last-Modified`: 마지막 수정 시각. `If-Modified-Since`로 비교\n\n" +
      "캐시 무효화 전략:\n" +
      "• 정적 자산(JS, CSS)은 파일명에 해시 포함 (`app.a1b2c3.js`) + 긴 `max-age`\n" +
      "• HTML은 `no-cache`로 항상 최신 버전 확인\n\n" +
      "CDN을 사용할 경우 캐시 계층이 추가되어 더 복잡한 전략이 필요합니다.",
    keywords: ["Cache-Control", "ETag", "304 Not Modified", "캐시 무효화", "CDN"],
  },
  {
    id: "net_05",
    category: "네트워크",
    question: "TCP와 UDP의 차이를 설명해주세요.",
    answer:
      "TCP (Transmission Control Protocol):\n" +
      "• 연결 지향: 통신 전 3-way handshake로 연결 수립\n" +
      "• 신뢰성: 패킷 손실 시 재전송, 순서 보장\n" +
      "• 흐름/혼잡 제어\n" +
      "• 속도 느림, 오버헤드 큼\n" +
      "• 사용: HTTP, HTTPS, 파일 전송, 이메일\n\n" +
      "UDP (User Datagram Protocol):\n" +
      "• 비연결: 핸드셰이크 없이 즉시 전송\n" +
      "• 신뢰성 없음: 손실·순서 보장 없음\n" +
      "• 오버헤드 적고 빠름\n" +
      "• 사용: DNS, 스트리밍, 게임, WebRTC, HTTP/3(QUIC)\n\n" +
      "프론트엔드 관련:\n" +
      "WebRTC는 실시간 영상/음성 통화에 UDP 기반 프로토콜을 사용합니다.\n" +
      "HTTP/3는 QUIC(UDP 기반)으로 TCP의 HOL Blocking 한계를 극복합니다.",
    keywords: ["3-way handshake", "신뢰성", "연결 지향", "WebRTC", "QUIC"],
  },
  {
    id: "net_06",
    category: "네트워크",
    question: "WebSocket이란 무엇이며, HTTP와 어떻게 다른가요?",
    answer:
      "WebSocket은 단일 TCP 연결에서 클라이언트와 서버 간 양방향(Full-Duplex) 통신을 가능하게 하는 프로토콜입니다.\n\n" +
      "HTTP와의 차이:\n" +
      "• HTTP: 클라이언트가 요청해야만 서버가 응답 (단방향, 반이중)\n" +
      "• WebSocket: 연결 수립 후 양측에서 언제든 데이터 전송 가능\n\n" +
      "연결 과정:\n" +
      "1. HTTP 업그레이드 요청 (`Upgrade: websocket` 헤더)\n" +
      "2. 서버가 101 Switching Protocols로 응답\n" +
      "3. 이후 WebSocket 프로토콜로 통신\n\n" +
      "사용 사례: 채팅, 실시간 알림, 협업 도구, 라이브 차트, 온라인 게임\n\n" +
      "대안:\n" +
      "• SSE (Server-Sent Events): 서버 → 클라이언트 단방향, 재연결 자동 처리. 실시간 알림에 적합\n" +
      "• Long Polling: WebSocket 미지원 환경 폴백",
    keywords: ["양방향 통신", "Upgrade", "Full-Duplex", "SSE", "Long Polling"],
  },

  // ──────────────────────────────────────────
  // 성능 최적화
  // ──────────────────────────────────────────
  {
    id: "perf_01",
    category: "성능최적화",
    question: "코드 스플리팅(Code Splitting)이란 무엇인가요?",
    answer:
      "코드 스플리팅은 번들을 여러 청크로 나눠 필요한 시점에만 로드하는 기법입니다.\n" +
      "초기 번들 크기를 줄여 첫 페이지 로딩을 빠르게 합니다.\n\n" +
      "방법:\n" +
      "1. 라우트 기반: 페이지별로 번들 분리 (가장 일반적)\n" +
      "2. 컴포넌트 기반: 무거운 컴포넌트를 동적 import로 분리\n\n" +
      "React에서 구현:\n" +
      "```tsx\n" +
      "import { lazy, Suspense } from 'react';\n\n" +
      "const HeavyChart = lazy(() => import('./HeavyChart'));\n\n" +
      "function Dashboard() {\n" +
      "  return (\n" +
      "    <Suspense fallback={<Spinner />}>\n" +
      "      <HeavyChart />\n" +
      "    </Suspense>\n" +
      "  );\n" +
      "}\n" +
      "```\n\n" +
      "Next.js에서는 `next/dynamic`으로 동일한 기능을 제공합니다.\n" +
      "Webpack의 `SplitChunksPlugin`으로 공통 청크(vendor)를 자동 분리할 수 있습니다.",
    keywords: ["동적 import", "React.lazy", "Suspense", "번들 크기", "청크"],
  },
  {
    id: "perf_02",
    category: "성능최적화",
    question: "Core Web Vitals의 주요 지표를 설명해주세요.",
    answer:
      "Core Web Vitals는 Google이 정의한 사용자 경험 핵심 성능 지표입니다.\n\n" +
      "1. LCP (Largest Contentful Paint) — 로딩 성능\n" +
      "   • 가장 큰 콘텐츠(이미지/텍스트)가 렌더링되는 시간\n" +
      "   • 권장: 2.5초 이내\n" +
      "   • 개선: 이미지 최적화, 서버 응답 시간 단축, 크리티컬 CSS 인라인\n\n" +
      "2. INP (Interaction to Next Paint) — 상호작용 응답성 (FID 대체)\n" +
      "   • 사용자 상호작용부터 다음 화면 업데이트까지 시간\n" +
      "   • 권장: 200ms 이내\n" +
      "   • 개선: 긴 작업 분할, 불필요한 JS 줄이기\n\n" +
      "3. CLS (Cumulative Layout Shift) — 시각적 안정성\n" +
      "   • 예상치 못한 레이아웃 이동 누적 점수\n" +
      "   • 권장: 0.1 이하\n" +
      "   • 개선: 이미지/광고에 크기 명시, 동적 콘텐츠 삽입 주의\n\n" +
      "측정 도구: Lighthouse, Chrome DevTools, PageSpeed Insights, Web Vitals JS 라이브러리",
    keywords: ["LCP", "INP", "CLS", "Lighthouse", "사용자 경험"],
  },
  {
    id: "perf_03",
    category: "성능최적화",
    question: "이미지 최적화 방법을 설명해주세요.",
    answer:
      "1. 포맷 선택:\n" +
      "   • WebP: PNG/JPEG 대비 25~34% 작음. 현재 가장 권장\n" +
      "   • AVIF: WebP보다 더 작지만 브라우저 지원 확인 필요\n" +
      "   • SVG: 아이콘/로고 등 벡터 그래픽에 사용\n\n" +
      "2. 반응형 이미지:\n" +
      "   ```html\n" +
      "   <img\n" +
      "     src=\"image-800.webp\"\n" +
      "     srcset=\"image-400.webp 400w, image-800.webp 800w\"\n" +
      "     sizes=\"(max-width: 600px) 400px, 800px\"\n" +
      "   />\n" +
      "   ```\n\n" +
      "3. 지연 로딩:\n" +
      "   • `loading=\"lazy\"` 속성 (네이티브)\n" +
      "   • 뷰포트 밖 이미지를 스크롤 시 로드\n\n" +
      "4. 사이즈 명시: `width`/`height` 속성으로 CLS 방지\n" +
      "5. CDN 사용: Cloudflare Images, imgix 등으로 자동 최적화\n" +
      "6. Next.js `<Image>`: 위 모든 최적화 자동 적용",
    keywords: ["WebP", "AVIF", "지연 로딩", "반응형 이미지", "CLS"],
  },
  {
    id: "perf_04",
    category: "성능최적화",
    question: "웹 성능 측정 및 최적화 접근 방법을 설명해주세요.",
    answer:
      "1단계 — 측정:\n" +
      "• Lighthouse / PageSpeed Insights: 전반적인 성능 점수\n" +
      "• Chrome DevTools Performance 탭: 런타임 성능 분석\n" +
      "• Web Vitals 라이브러리: 실 사용자 데이터(RUM) 수집\n" +
      "• Bundle Analyzer: 번들 크기 시각화\n\n" +
      "2단계 — 분석 & 우선순위:\n" +
      "• 가장 큰 영향을 주는 지표(LCP, INP) 먼저 개선\n" +
      "• 병목 원인 파악: 큰 JS 번들? 느린 서버? 무거운 이미지?\n\n" +
      "3단계 — 개선:\n" +
      "• 로딩: 코드 스플리팅, 이미지 최적화, CDN, 프리로드\n" +
      "• 실행: 긴 태스크 분할, 메모이제이션, 불필요한 리렌더링 제거\n" +
      "• 캐싱: Cache-Control, Service Worker\n\n" +
      "4단계 — 검증: A/B 테스트 또는 RUM으로 실제 개선 효과 확인\n\n" +
      "측정 없이 최적화하지 않습니다 — \"premature optimization is the root of all evil\"",
    keywords: ["Lighthouse", "RUM", "Bundle Analyzer", "병목 분석", "Core Web Vitals"],
  },
  {
    id: "perf_05",
    category: "성능최적화",
    question: "레이지 로딩(Lazy Loading)과 프리로딩(Preloading)의 차이를 설명해주세요.",
    answer:
      "레이지 로딩:\n" +
      "• 필요한 순간까지 리소스 로드를 지연\n" +
      "• 초기 로딩 성능 개선, 불필요한 데이터 절약\n" +
      "• 적용: 이미지 `loading=\"lazy\"`, 라우트 코드 스플리팅, `IntersectionObserver`\n\n" +
      "프리로딩:\n" +
      "• 현재 필요하지 않지만 곧 필요할 리소스를 미리 로드\n" +
      "• 실제 필요 시점에 즉시 사용 가능\n\n" +
      "종류:\n" +
      "```html\n" +
      "<!-- preload: 현재 페이지에서 곧 필요한 리소스 -->\n" +
      "<link rel=\"preload\" href=\"hero.webp\" as=\"image\">\n\n" +
      "<!-- prefetch: 다음 페이지에서 필요할 것 같은 리소스 -->\n" +
      "<link rel=\"prefetch\" href=\"/next-page-bundle.js\">\n\n" +
      "<!-- preconnect: DNS + TCP + TLS 사전 연결 -->\n" +
      "<link rel=\"preconnect\" href=\"https://api.example.com\">\n" +
      "```\n\n" +
      "Next.js의 `<Link>` 컴포넌트는 뷰포트에 들어온 링크의 번들을 자동으로 prefetch합니다.",
    keywords: ["IntersectionObserver", "preload", "prefetch", "preconnect", "초기 로딩"],
  },
  {
    id: "perf_06",
    category: "성능최적화",
    question: "번들 최적화 방법을 설명해주세요.",
    answer:
      "1. 코드 스플리팅: 라우트/컴포넌트 단위로 청크 분리\n\n" +
      "2. Tree Shaking: 사용되지 않는 코드 제거 (ES Module + `sideEffects: false`)\n" +
      "```js\n" +
      "// 나쁜 예 — lodash 전체 import\n" +
      "import _ from 'lodash';\n" +
      "// 좋은 예 — 필요한 함수만\n" +
      "import debounce from 'lodash/debounce';\n" +
      "```\n\n" +
      "3. 외부 라이브러리 분리: 변경이 잦지 않은 vendor 청크를 별도 분리해 캐시 활용\n\n" +
      "4. 미니피케이션/압축: Terser로 JS 압축, gzip/Brotli 서버 압축\n\n" +
      "5. 동적 import: 무거운 라이브러리를 사용 시점에만 로드\n" +
      "```js\n" +
      "const { Chart } = await import('chart.js');\n" +
      "```\n\n" +
      "6. Bundle Analyzer: `webpack-bundle-analyzer` 또는 `vite-bundle-visualizer`로 크기 시각화 후 큰 패키지 대체재 탐색",
    keywords: ["Tree Shaking", "미니피케이션", "vendor 청크", "동적 import", "Bundle Analyzer"],
  },

  // ──────────────────────────────────────────
  // 웹 보안
  // ──────────────────────────────────────────
  {
    id: "sec_01",
    category: "웹보안",
    question: "XSS(Cross-Site Scripting)란 무엇이며, 어떻게 방지하나요?",
    answer:
      "XSS는 공격자가 악성 스크립트를 웹 페이지에 삽입하여 다른 사용자의 브라우저에서 실행시키는 공격입니다.\n\n" +
      "유형:\n" +
      "• Stored XSS: 악성 스크립트가 DB에 저장되어 모든 방문자에게 전달\n" +
      "• Reflected XSS: URL 파라미터의 스크립트가 응답에 그대로 반영\n" +
      "• DOM-based XSS: JS가 DOM을 직접 조작하는 과정에서 발생\n\n" +
      "방지 방법:\n" +
      "• 입력값 이스케이프: `<`, `>`, `\"`, `'` 등을 HTML 엔티티로 변환\n" +
      "• React는 JSX에서 기본적으로 자동 이스케이프 처리 (`dangerouslySetInnerHTML` 사용 금지)\n" +
      "• CSP(Content Security Policy) 헤더 설정: 허용된 스크립트 출처만 실행\n" +
      "• 쿠키에 `HttpOnly` 플래그: JS로 접근 불가\n" +
      "• DOMPurify 등 HTML Sanitizer 라이브러리 사용 (리치 텍스트 에디터 등)\n\n" +
      "```html\n" +
      "<!-- CSP 예시 -->\n" +
      "<meta http-equiv=\"Content-Security-Policy\" content=\"script-src 'self'\">\n" +
      "```",
    keywords: ["입력값 이스케이프", "CSP", "HttpOnly", "dangerouslySetInnerHTML", "DOMPurify"],
  },
  {
    id: "sec_02",
    category: "웹보안",
    question: "CSRF(Cross-Site Request Forgery)란 무엇이며, 어떻게 방지하나요?",
    answer:
      "CSRF는 인증된 사용자가 자신의 의도와 무관하게 공격자가 원하는 요청을 보내도록 하는 공격입니다.\n\n" +
      "예시 시나리오:\n" +
      "1. 사용자가 은행 사이트에 로그인 (쿠키 발급)\n" +
      "2. 공격자 사이트 방문 → 은행으로 이체 요청을 보내는 form 자동 제출\n" +
      "3. 브라우저가 쿠키를 자동 첨부해 이체 실행\n\n" +
      "방지 방법:\n" +
      "• CSRF 토큰: 서버가 발급한 고유 토큰을 요청에 포함, 서버에서 검증\n" +
      "• SameSite 쿠키: `SameSite=Strict` 또는 `SameSite=Lax`로 외부 사이트 요청 시 쿠키 전송 차단\n" +
      "• Origin/Referer 검증: 서버에서 요청 출처 확인\n" +
      "• 중요 작업에 재인증 요구\n\n" +
      "SPA에서 JWT를 Authorization 헤더로 전송하는 경우 CSRF에 취약하지 않습니다 (쿠키 미사용). 하지만 로컬스토리지 저장은 XSS에 취약합니다.",
    keywords: ["CSRF 토큰", "SameSite", "쿠키", "Origin 검증", "SPA"],
  },
  {
    id: "sec_03",
    category: "웹보안",
    question: "Content Security Policy(CSP)란 무엇인가요?",
    answer:
      "CSP는 브라우저에게 페이지에서 허용되는 리소스의 출처를 명시하는 HTTP 응답 헤더입니다.\n" +
      "XSS 공격으로 삽입된 악성 스크립트의 실행을 차단하는 것이 주 목적입니다.\n\n" +
      "```\n" +
      "Content-Security-Policy:\n" +
      "  default-src 'self';                     # 기본: 같은 출처만\n" +
      "  script-src 'self' cdn.example.com;      # JS: 자사 + CDN만\n" +
      "  style-src 'self' 'unsafe-inline';       # CSS: inline 허용\n" +
      "  img-src 'self' data: https:;            # 이미지: HTTPS 전체\n" +
      "  connect-src 'self' api.example.com;     # fetch/XHR 대상\n" +
      "```\n\n" +
      "주요 지시어:\n" +
      "• `'self'`: 같은 출처만 허용\n" +
      "• `'none'`: 모두 차단\n" +
      "• `'unsafe-inline'`: 인라인 스크립트/스타일 허용 (가능하면 사용 자제)\n" +
      "• `'nonce-{값}'`: 특정 nonce가 있는 스크립트만 허용\n\n" +
      "처음 도입 시 `Content-Security-Policy-Report-Only`로 위반 사항만 보고 받아 정책을 점진적으로 강화할 수 있습니다.",
    keywords: ["CSP 헤더", "XSS 방지", "nonce", "리소스 출처", "Report-Only"],
  },
  {
    id: "sec_04",
    category: "웹보안",
    question: "HTTPS에서 인증서는 어떻게 신뢰를 보장하나요? (PKI)",
    answer:
      "공개키 기반 구조(PKI)와 인증서 체계:\n\n" +
      "1. 인증 기관(CA, Certificate Authority): 서버 인증서를 발급하고 서명하는 신뢰할 수 있는 기관\n" +
      "2. 인증서 체인: 서버 인증서 → 중간 CA → 루트 CA (브라우저가 신뢰 목록으로 사전 내장)\n\n" +
      "동작 방식:\n" +
      "1. 서버가 개인키/공개키 쌍 생성 → CA에 CSR 제출\n" +
      "2. CA가 신원 확인 후 서버 공개키 + 도메인 정보에 CA 개인키로 서명 → 인증서 발급\n" +
      "3. 브라우저가 인증서 수신 → CA 공개키로 서명 검증 → 유효하면 신뢰\n\n" +
      "HSTS (HTTP Strict Transport Security):\n" +
      "서버가 브라우저에게 HTTPS만 사용하도록 강제하는 응답 헤더. 다운그레이드 공격 방지\n" +
      "```\n" +
      "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload\n" +
      "```",
    keywords: ["PKI", "인증 기관", "인증서 체인", "HSTS", "공개키/개인키"],
  },
  {
    id: "sec_05",
    category: "웹보안",
    question: "JWT(JSON Web Token)의 구조와 인증 방식을 설명해주세요.",
    answer:
      "JWT는 세 부분이 `.`으로 연결된 Base64Url 인코딩 문자열입니다:\n" +
      "`Header.Payload.Signature`\n\n" +
      "• Header: 알고리즘(`alg: HS256`) + 토큰 타입\n" +
      "• Payload: 클레임 (sub, iat, exp, 사용자 정보 등)\n" +
      "• Signature: `HMAC(Header + Payload, 비밀키)` — 위변조 방지\n\n" +
      "인증 흐름:\n" +
      "1. 로그인 → 서버가 JWT 발급\n" +
      "2. 클라이언트가 `Authorization: Bearer <token>` 헤더로 전송\n" +
      "3. 서버가 서명 검증 + 만료 확인\n\n" +
      "주의사항:\n" +
      "• Payload는 Base64 인코딩이므로 누구든 볼 수 있음 → 민감 정보 포함 금지\n" +
      "• 저장 위치: HttpOnly 쿠키(XSS 방어) vs 메모리(새로고침 시 소실)\n" +
      "• Access Token 만료 시간 짧게 + Refresh Token으로 갱신\n" +
      "• 토큰 무효화가 어려움 (Stateless 특성) → 짧은 만료 시간 또는 블랙리스트 DB 유지",
    keywords: ["Header.Payload.Signature", "HMAC", "Bearer", "Refresh Token", "Stateless"],
  },
];

/** 전체 카테고리 목록 */
export const CS_CATEGORIES: CSCategory[] = [
  "JavaScript",
  "TypeScript",
  "React",
  "브라우저",
  "네트워크",
  "성능최적화",
  "웹보안",
];

/**
 * 카테고리로 질문을 필터링합니다. category가 없으면 전체를 반환합니다.
 */
export function getQuestionsByCategory(category?: CSCategory): CSQuestion[] {
  if (!category) return CS_QUESTIONS;
  return CS_QUESTIONS.filter((q) => q.category === category);
}

/**
 * 입력 문자열을 CSCategory로 매핑합니다. 없으면 null을 반환합니다.
 */
export function parseCategory(input: string): CSCategory | null {
  const normalized = input.trim().toLowerCase();
  const map: Record<string, CSCategory> = {
    js: "JavaScript",
    javascript: "JavaScript",
    자바스크립트: "JavaScript",
    ts: "TypeScript",
    typescript: "TypeScript",
    타입스크립트: "TypeScript",
    react: "React",
    리액트: "React",
    브라우저: "브라우저",
    browser: "브라우저",
    네트워크: "네트워크",
    network: "네트워크",
    net: "네트워크",
    성능: "성능최적화",
    성능최적화: "성능최적화",
    perf: "성능최적화",
    performance: "성능최적화",
    보안: "웹보안",
    웹보안: "웹보안",
    security: "웹보안",
  };
  return map[normalized] ?? null;
}

/**
 * 배열에서 랜덤 요소를 반환합니다.
 */
export function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
