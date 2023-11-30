export type Unit = "C" | "F" | "K";

export class Temperature {
  public celsius: number;
  public fahrenheit: number;
  public kelvin: number;

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

  private round(value) {
    return Math.round(value * 10) / 10;
  }

  private CtoF(val) {
    return val * 1.8 + 32;
  }

  private CtoK(val) {
    return val + 273.15;
  }

  private FtoC(val) {
    return (val - 32) / 1.8;
  }

  private KtoC(val) {
    return val - 273.15;
  }
}
