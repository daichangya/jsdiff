/**
 * 表示文本差异中的一个变化单元对象
 * @template ValueT 变化值的类型
 */
export interface ChangeObject<ValueT> {
  /**
   * 该变化对象所代表的所有标记(token)的连接内容 - 通常是作为单个字符串的添加、删除或公共文本。
   * 在标记被认为是公共的但不完全相同的情况下（例如因为使用了 ignoreCase 选项或自定义比较器），
   * 这里将提供新字符串中的值。
   */
  value: ValueT;
  /**
   * 如果该值是插入到新字符串中则为 true，否则为 false
   */
  added: boolean;
  /**
   * 如果该值是从旧字符串中删除则为 true，否则为 false
   */
  removed: boolean;
  /**
   * 该变化对象中的值由多少个标记组成（例如对于 diffChars 是字符数，对于 diffLines 是行数）
   */
  count: number;
}

// 这里使用"Change"这个名称是为了与之前来自 DefinitelyTyped 的类型定义保持一致。
// 我猜测这可能是人们在自己代码中最常明确引用的类型，因此保持名称一致是有价值的，
// 即使许多其他类型的名称与旧的 DefinitelyTyped 名称不一致。
export type Change = ChangeObject<string>;
export type ArrayChange<T> = ChangeObject<T[]>;

/**
 * 通用差异选项接口
 */
export interface CommonDiffOptions {
  /**
   * 如果为 true，返回的变化对象数组将包含每个标记一个变化对象（例如调用 diffLines 时每行一个），
   * 而不是将连续的全部添加/全部删除/全部保留的标记合并为单个变化对象。
   */
  oneChangePerToken?: boolean,
}

/**
 * 超时选项接口
 */
export interface TimeoutOption {
  /**
   * 差异算法在指定毫秒数后中止并返回 undefined 的时间。
   * 支持的函数与 maxEditLength 相同。
   */
  timeout: number;
}

/**
 * 最大编辑长度选项接口
 */
export interface MaxEditLengthOption {
  /**
   * 指定旧文本和新文本之间考虑的最大编辑距离。
   * 您可以使用此选项来限制对大型、非常不同文本进行差异计算的计算成本，
   * 通过在成本巨大时提前放弃。
   * 此选项可以传递给差异函数（diffLines、diffChars 等）或补丁创建函数（structuredPatch、createPatch 等），
   * 所有这些函数在达到最大编辑长度时都会返回 undefined 而不是正常返回值来表示。
   */
  maxEditLength: number;
}

/**
 * 可中止的差异选项类型
 */
export type AbortableDiffOptions = TimeoutOption | MaxEditLengthOption;

/**
 * 不可中止的差异回调类型
 */
export type DiffCallbackNonabortable<T> = (result: ChangeObject<T>[]) => void;
/**
 * 可中止的差异回调类型
 */
export type DiffCallbackAbortable<T> = (result: ChangeObject<T>[] | undefined) => void;

/**
 * 不可中止的回调选项接口
 */
export interface CallbackOptionNonabortable<T> {
  /**
   * 如果提供，将在异步模式下计算差异以避免在计算差异时阻塞事件循环。
   * callback 选项的值应该是一个函数，它将接收计算出的差异或补丁作为第一个参数。
   */
  callback: DiffCallbackNonabortable<T>
}
/**
 * 可中止的回调选项接口
 */
export interface CallbackOptionAbortable<T> {
  /**
   * 如果提供，将在异步模式下计算差异以避免在计算差异时阻塞事件循环。
   * callback 选项的值应该是一个函数，它将接收计算出的差异或补丁作为第一个参数。
   */
  callback: DiffCallbackAbortable<T>
}

/**
 * 数组差异选项接口
 */
interface DiffArraysOptions<T> extends CommonDiffOptions {
  /**
   * 自定义比较函数
   */
  comparator?: (a: T, b: T) => boolean,
}
/**
 * 不可中止的数组差异选项接口
 */
export interface DiffArraysOptionsNonabortable<T> extends DiffArraysOptions<T> {
  /**
   * 如果提供，将在异步模式下计算差异以避免在计算差异时阻塞事件循环。
   * callback 选项的值应该是一个函数，它将接收计算出的差异或补丁作为第一个参数。
   */
  callback?: DiffCallbackNonabortable<T[]>
}
/**
 * 可中止的数组差异选项类型
 */
export type DiffArraysOptionsAbortable<T> = DiffArraysOptions<T> & AbortableDiffOptions & Partial<CallbackOptionAbortable<T[]>>;


/**
 * 字符差异选项接口
 */
interface DiffCharsOptions extends CommonDiffOptions {
  /**
   * 如果为 true，则大写和小写形式的字符被视为相等。
   * @default false
   */
  ignoreCase?: boolean;
}
/**
 * 不可中止的字符差异选项接口
 */
export interface DiffCharsOptionsNonabortable extends DiffCharsOptions {
  /**
   * 如果提供，将在异步模式下计算差异以避免在计算差异时阻塞事件循环。
   * callback 选项的值应该是一个函数，它将接收计算出的差异或补丁作为第一个参数。
   */
  callback?: DiffCallbackNonabortable<string>
}
/**
 * 可中止的字符差异选项类型
 */
export type DiffCharsOptionsAbortable = DiffCharsOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>

/**
 * 行差异选项接口
 */
interface DiffLinesOptions extends CommonDiffOptions {
  /**
   * 如果为 true，则在执行差异之前删除所有尾随的回车符(\r)。
   * 这有助于在对 UNIX 文本文件与 Windows 文本文件进行差异比较时获得有用的结果。
   * @default false
   */
  stripTrailingCr?: boolean,
  /**
   * 如果为 true，则将每行末尾的换行符视为独立的标记。
   * 这允许对换行结构的更改独立于行内容发生并被如此处理。
   * 一般来说，这是对人类更友好的 diffLines 形式；关闭此选项的默认行为更适合补丁和其他计算机友好的输出。
   *
   * 注意，虽然同时使用 ignoreWhitespace 和 newlineIsToken 不会出错，但结果可能不如预期。
   * 当 ignoreWhitespace: true 且 newlineIsToken: false 时，将完全空行更改为包含一些空格被视为非更改，
   * 但当 ignoreWhitespace: true 且 newlineIsToken: true 时，它被视为插入。
   * 这是因为在 newlineIsToken 模式下，完全空白行的内容根本不是标记。
   *
   * @default false
   */
  newlineIsToken?: boolean,
  /**
   * 如果为 true，则在将最后一行与其他行比较时忽略末尾缺少的换行符。
   * （默认情况下，文本 'a\nb\nc' 中的行 'b\n' 不被认为与文本 'a\nb' 中的行 'b' 相等；此选项使它们被视为相等。）
   * 如果 ignoreWhitespace 或 newlineIsToken 也为 true，则忽略此选项。
   * @default false
   */
  ignoreNewlineAtEof?: boolean,
  /**
   * 如果为 true，则在检查两行是否相等时忽略前导和尾随的空白字符。
   * @default false
   */
  ignoreWhitespace?: boolean,
}
/**
 * 不可中止的行差异选项接口
 */
export interface DiffLinesOptionsNonabortable extends DiffLinesOptions {
  /**
   * 如果提供，将在异步模式下计算差异以避免在计算差异时阻塞事件循环。
   * callback 选项的值应该是一个函数，它将接收计算出的差异或补丁作为第一个参数。
   */
  callback?: DiffCallbackNonabortable<string>
}
/**
 * 可中止的行差异选项类型
 */
export type DiffLinesOptionsAbortable = DiffLinesOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


/**
 * 单词差异选项接口
 */
interface DiffWordsOptions extends CommonDiffOptions {
  /**
   * 同 diffChars 中的选项。
   * @default false
   */
  ignoreCase?: boolean

  /**
   * 可选的 Intl.Segmenter 对象（必须具有 'word' 的 granularity），供 diffWords 用于将文本分割成单词。
   *
   * 注意，这故意错误地类型化为 any，以避免 lib 和 target 设置在 tsconfig.json 中早于 es2022 的用户
   * 在构建时出现关于 Intl.Segmenter 不存在的类型错误。
   * 这有点丑陋，因为它使真正使用此功能的用户的类型声明变差，但似乎值得避免大多数库用户（可能不使用此特定选项）
   * 遇到令人困惑的错误并被迫将他们的 lib 更改为 es2022（即使他们自己的代码不使用任何 es2022 函数）。
   *
   * 默认情况下，diffWords 不使用 Intl.Segmenter，只使用一些正则表达式将文本分割成单词。
   * 这往往会给出比 Intl.Segmenter 更差的结果，但确保结果在环境中一致；
   * Intl.Segmenter 行为只是松散地规范，浏览器中的实现原则上可能在未来发生巨大变化。
   * 如果您想使用带有 Intl.Segmenter 的 diffWords 但确保它在任何环境中行为相同，请使用 Intl.Segmenter 填充而不是 JavaScript 引擎的原生 Intl.Segmenter 实现。
   *
   * 使用 Intl.Segmenter 应该能够比默认行为更好地对非英文文本进行单词级差异比较。
   * 例如，Intl.Segmenter 通常可以通过内置词典识别哪些相邻的中文字符序列构成单词，从而允许对中文进行单词级差异比较。
   * 通过在实例化分段器时指定语言（例如 new Intl.Segmenter('sv', {granularity: 'word'})），
   * 您还可以支持特定语言的规则，如将瑞典语的冒号分隔缩写（如 k:a 表示 kyrka）视为单个单词；默认情况下这将被视为由冒号分隔的两个单词。
   */
  intlSegmenter?: any,
}
/**
 * 不可中止的单词差异选项接口
 */
export interface DiffWordsOptionsNonabortable extends DiffWordsOptions {
  /**
   * 如果提供，将在异步模式下计算差异以避免在计算差异时阻塞事件循环。
   * callback 选项的值应该是一个函数，它将接收计算出的差异或补丁作为第一个参数。
   */
  callback?: DiffCallbackNonabortable<string>
}
/**
 * 可中止的单词差异选项类型
 */
export type DiffWordsOptionsAbortable = DiffWordsOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


/**
 * 句子差异选项接口
 */
interface DiffSentencesOptions extends CommonDiffOptions {}
/**
 * 不可中止的句子差异选项接口
 */
export interface DiffSentencesOptionsNonabortable extends DiffSentencesOptions {
  /**
   * 如果提供，将在异步模式下计算差异以避免在计算差异时阻塞事件循环。
   * callback 选项的值应该是一个函数，它将接收计算出的差异或补丁作为第一个参数。
   */
  callback?: DiffCallbackNonabortable<string>
}
/**
 * 可中止的句子差异选项类型
 */
export type DiffSentencesOptionsAbortable = DiffSentencesOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


/**
 * JSON 差异选项接口
 */
interface DiffJsonOptions extends CommonDiffOptions {
  /**
   * 用于替换 undefined 的值。如果提供了 stringifyReplacer 则忽略此选项。
   */
  undefinedReplacement?: any,
  /**
   * 自定义替换函数。
   * 操作方式类似于 JSON.stringify() 的 replacer 参数，但必须是函数。
   */
  stringifyReplacer?: (k: string, v: any) => any,
}
/**
 * 不可中止的 JSON 差异选项接口
 */
export interface DiffJsonOptionsNonabortable extends DiffJsonOptions {
  /**
   * 如果提供，将在异步模式下计算差异以避免在计算差异时阻塞事件循环。
   * callback 选项的值应该是一个函数，它将接收计算出的差异或补丁作为第一个参数。
   */
  callback?: DiffCallbackNonabortable<string>
}
/**
 * 可中止的 JSON 差异选项类型
 */
export type DiffJsonOptionsAbortable = DiffJsonOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


/**
 * CSS 差异选项接口
 */
interface DiffCssOptions extends CommonDiffOptions {}
/**
 * 不可中止的 CSS 差异选项接口
 */
export interface DiffCssOptionsNonabortable extends DiffCssOptions {
  /**
   * 如果提供，将在异步模式下计算差异以避免在计算差异时阻塞事件循环。
   * callback 选项的值应该是一个函数，它将接收计算出的差异或补丁作为第一个参数。
   */
  callback?: DiffCallbackNonabortable<string>
}
/**
 * 可中止的 CSS 差异选项类型
 */
export type DiffCssOptionsAbortable = DiffCssOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>


/**
 * 注意，这包含了所有内置差异函数接受的选项的并集。
 * README 中注明了哪些选项可以与哪些函数一起使用。
 * 将选项与不支持它的差异函数一起使用可能会产生不合理的结果。
 */
export type AllDiffOptions =
    DiffArraysOptions<unknown> &
    DiffCharsOptions &
    DiffWordsOptions &
    DiffLinesOptions &
    DiffJsonOptions;

/**
 * 结构化补丁接口
 */
export interface StructuredPatch {
  /**
   * 旧文件名
   */
  oldFileName: string,
  /**
   * 新文件名
   */
  newFileName: string,
  /**
   * 旧文件头
   */
  oldHeader: string | undefined,
  /**
   * 新文件头
   */
  newHeader: string | undefined,
  /**
   * 补丁块数组
   */
  hunks: StructuredPatchHunk[],
  /**
   * 索引信息（可选）
   */
  index?: string,
}

/**
 * 结构化补丁块接口
 */
export interface StructuredPatchHunk {
  /**
   * 旧行起始位置
   */
  oldStart: number,
  /**
   * 旧行数
   */
  oldLines: number,
  /**
   * 新行起始位置
   */
  newStart: number,
  /**
   * 新行数
   */
  newLines: number,
  /**
   * 行内容数组
   */
  lines: string[],
}
