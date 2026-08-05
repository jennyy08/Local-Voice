import MapView from "./MapView";
import ReportForm from "./ReportForm";

// You'll pass all the necessary states/functions from App.tsx down into this component
export default function MapSection(props: any) { // (You can type these props later like we did with the others!)
  return (
    <section id="map" className="bg-secondary py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <span className="font-mono text-[10px] text-accent tracking-[0.22em] uppercase">Interactive Map</span>
          <h2 className="font-display text-4xl sm:text-5xl text-foreground mt-2 tracking-tight">
            Report an Issue
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed">
            Click anywhere on the map to drop a pin at that location, or select an existing pin to see its report. Reports are added to the community feed for everyone to see — for urgent issues, contact Ottawa 311 directly.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 items-start">
          <MapView 
            locatingUser={props.locatingUser}
            mapCenter={props.mapCenter}
            userLocation={props.userLocation}
            visibleIssues={props.visibleIssues}
            draftPin={props.draftPin}
            filterCategory={props.filterCategory}
            setFilterCategory={props.setFilterCategory}
            RecenterMap={props.RecenterMap}
            MapClickHandler={props.MapClickHandler}
            handleMapClick={props.handleMapClick}
            youAreHereIcon={props.youAreHereIcon}
            categoryDivIcon={props.categoryDivIcon}
            draftPinIcon={props.draftPinIcon}
          />
          <ReportForm 
            reportSubmitted={props.reportSubmitted}
            submitting={props.submitting}
            submitError={props.submitError}
            reportForm={props.reportForm}
            setReportForm={props.setReportForm}
            handleReport={props.handleReport}
            photoDataUrl={props.photoDataUrl}
            setPhotoFile={props.setPhotoFile}
            setPhotoDataUrl={props.setPhotoDataUrl}
            handlePhotoChange={props.handlePhotoChange}
            convertingPhoto={props.convertingPhoto}
          />
        </div>
      </div>
    </section>
  );
}