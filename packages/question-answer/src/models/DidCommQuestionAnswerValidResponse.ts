export class DidCommQuestionAnswerValidResponse {
  public constructor(options: DidCommQuestionAnswerValidResponse) {
    if (options) {
      this.text = options.text
    }
  }

  public text!: string
}
