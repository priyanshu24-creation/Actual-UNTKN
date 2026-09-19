function LoadingState({
  text = "LOADING..."
}) {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>

      <p>{text}</p>
    </div>
  );
}

export default LoadingState;