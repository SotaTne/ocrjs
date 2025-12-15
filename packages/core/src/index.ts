class ErrorClass {
  private field: string;
  constructor() {
    this.field = 'test';
  }
  errorMethod(n: string) {
    console.log(this.field);
    console.error(n);
  }
}

class SuccessClass {
  #privateField: string;
  constructor() {
    this.#privateField = 'test';
  }
  successMethod() {
    console.log(this.#privateField);
  }
}

const aErrorClassInstance = new ErrorClass();
const aSuccessClassInstance = new SuccessClass();
aErrorClassInstance.errorMethod('test');
aSuccessClassInstance.successMethod();
