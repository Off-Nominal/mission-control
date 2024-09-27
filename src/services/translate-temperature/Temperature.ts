export type Unit = "C" | "F" | "K";

export class Temperature {
  public celsius: number = 0;
  public fahrenheit: number = 0;
  public kelvin: number = 0;

  constructor(value: number, unit: Unit) {
    if (unit === "C") {
      this.celsius = value;

      this.kelvin = this.round(this.CtoK(value));
      this.fahrenheit = this.round(this.CtoF(value));
    }

    if (unit === "K") {
      this.kelvin = value;

      this.celsius = this.round(this.KtoC(value));
      this.fahrenheit = this.round(this.CtoF(this.celsius));
    }

    if (unit === "F") {
      this.fahrenheit = value;

      this.celsius = this.round(this.FtoC(value));
      this.kelvin = this.round(this.CtoK(this.celsius));
    }
  }

  private round(value: number) {
    return Math.round(value * 10) / 10;
  }

  private CtoF(value: number) {
    return value * 1.8 + 32;
  }

  private CtoK(value: number) {
    return value + 273.15;
  }

  private FtoC(value: number) {
    return (value - 32) / 1.8;
  }

  private KtoC(value: number) {
    return value - 273.15;
  }
}
