import { getDate } from "./helper";

export async function getVaccine(pincode: string) {
  const nDate = getDate();
  const data = await fetch(
    `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${nDate}`
  )
    .then((response) => response.json())
    .then((data: RootObject) => {
      return data.centers;
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
    });
  return data;
}

export async function getAvail(age: number = 18, data: Center[]) {
  const found = new Array<IFound>();
  data.forEach((center: Center) => {
    const sessions = center.sessions;
    sessions.forEach((val) => {
      if (val.available_capacity > 0 && val.min_age_limit <= age) {
        let slots = "";
        val.slots.forEach((val: string) => {
          slots = slots + "\n" + val;
        });
        found.push({
          name: center.name,
          address: center.address,
          date: val.date,
          slots: slots,
          vaccine: val.vaccine,
          available_capacity: val.available_capacity,
          fee: center.fee_type,
        });
      }
    });
  });
  return found;
}
interface RootObject {
  centers: Center[];
}
interface Center {
  center_id: number;
  name: string;
  address: string;
  state_name: string;
  district_name: string;
  block_name: string;
  pincode: number;
  lat: number;
  long: number;
  from: string;
  to: string;
  fee_type: string;
  sessions: Session[];
}
interface Session {
  session_id: string;
  date: string;
  available_capacity: number;
  min_age_limit: number;
  vaccine: string;
  slots: string[];
}
