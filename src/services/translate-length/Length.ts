export type Unit = "mm" | "cm" | "m" | "km" | "in" | "ft" | "mi";

export class Length {
  public millimeters: number = 0;
  public centimeters: number = 0;
  public meters: number = 0;
  public kilometers: number = 0;
  public inches: number = 0;
  public feet: number = 0;
  public miles: number = 0;

  constructor(value: number, unit: Unit) {
    // Convert to base unit (meters) first, then to all other units
    const meters = this.toMeters(value, unit);
    
    this.meters = this.round(meters);
    this.millimeters = this.round(meters * 1000);
    this.centimeters = this.round(meters * 100);
    this.kilometers = this.round(meters / 1000);
    this.inches = this.round(meters * 39.3701);
    this.feet = this.round(meters * 3.28084);
    this.miles = this.round(meters / 1609.344);
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }

  private toMeters(value: number, unit: Unit): number {
    switch (unit) {
      case "mm":
        return value / 1000;
      case "cm":
        return value / 100;
      case "m":
        return value;
      case "km":
        return value * 1000;
      case "in":
        return value / 39.3701;
      case "ft":
        return value / 3.28084;
      case "mi":
        return value * 1609.344;
      default:
        return value;
    }
  }
}