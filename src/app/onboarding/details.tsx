import { Redirect, router } from "expo-router";

import { Button } from "@/components/Button";
import { ChipGroup, Question, StepScaffold, TextField } from "@/features/onboarding/components";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";

const single = (value: string | null) => (value ? [value] : []);
const toggleSingle = (current: string | null, option: string) => (current === option ? null : option);

function RenterQuestions() {
  const { renter, updateRenter } = useOnboarding();
  return (
    <>
      <Question label="Where do you want to live?">
        <TextField
          testID="renter-location"
          placeholder="City or neighborhood"
          value={renter.location}
          onChangeText={(location) => updateRenter({ location })}
          autoCapitalize="words"
        />
      </Question>
      <Question label="Monthly budget">
        <ChipGroup
          testIDPrefix="budget"
          options={["Under $1,500", "$1,500–2,500", "$2,500–4,000", "$4,000+"]}
          selected={single(renter.budget)}
          onToggle={(o) => updateRenter({ budget: toggleSingle(renter.budget, o) })}
        />
      </Question>
      <Question label="When do you want to move in?">
        <ChipGroup
          testIDPrefix="move-in"
          options={["ASAP", "1–3 months", "3–6 months", "Just browsing"]}
          selected={single(renter.moveIn)}
          onToggle={(o) => updateRenter({ moveIn: toggleSingle(renter.moveIn, o) })}
        />
      </Question>
      <Question label="Looking for">
        <ChipGroup
          testIDPrefix="space"
          options={["A room", "An entire place"]}
          selected={single(renter.space)}
          onToggle={(o) => updateRenter({ space: toggleSingle(renter.space, o) })}
        />
      </Question>
      <Question label="Must-haves">
        <ChipGroup
          testIDPrefix="amenity"
          options={["In-unit laundry", "Parking", "Pets allowed", "Dishwasher", "Outdoor space", "Air conditioning"]}
          selected={renter.amenities}
          onToggle={(o) =>
            updateRenter({
              amenities: renter.amenities.includes(o)
                ? renter.amenities.filter((a) => a !== o)
                : [...renter.amenities, o],
            })
          }
        />
      </Question>
    </>
  );
}

function LandlordQuestions() {
  const { landlord, updateLandlord } = useOnboarding();
  return (
    <>
      <Question label="How many properties do you manage?">
        <ChipGroup
          testIDPrefix="count"
          options={["1", "2–5", "6–20", "20+"]}
          selected={single(landlord.propertyCount)}
          onToggle={(o) => updateLandlord({ propertyCount: toggleSingle(landlord.propertyCount, o) })}
        />
      </Question>
      <Question label="Where are they?">
        <TextField
          testID="landlord-location"
          placeholder="City or neighborhood"
          value={landlord.location}
          onChangeText={(location) => updateLandlord({ location })}
          autoCapitalize="words"
        />
      </Question>
      <Question label="Are they currently occupied?">
        <ChipGroup
          testIDPrefix="occupied"
          options={["All occupied", "Some vacant", "All vacant"]}
          selected={single(landlord.occupied)}
          onToggle={(o) => updateLandlord({ occupied: toggleSingle(landlord.occupied, o) })}
        />
      </Question>
      <Question label="Want to list vacancies on Dweller?">
        <ChipGroup
          testIDPrefix="list"
          options={["Yes", "Not right now"]}
          selected={single(landlord.listVacancies)}
          onToggle={(o) => updateLandlord({ listVacancies: toggleSingle(landlord.listVacancies, o) })}
        />
      </Question>
    </>
  );
}

export default function DetailsScreen() {
  const { role, renter, landlord } = useOnboarding();
  if (!role) return <Redirect href="/onboarding" />;

  const ready = role === "renter" ? renter.location.trim() !== "" : landlord.propertyCount !== null;

  return (
    <StepScaffold
      step={2}
      title={role === "renter" ? "Tell us what home looks like" : "Tell us about your properties"}
      subtitle="A few answers so Dweller starts in the right place."
      footer={
        <Button
          testID="details-continue"
          label="Continue"
          disabled={!ready}
          onPress={() => router.push("/onboarding/home")}
        />
      }
    >
      {role === "renter" ? <RenterQuestions /> : <LandlordQuestions />}
    </StepScaffold>
  );
}
