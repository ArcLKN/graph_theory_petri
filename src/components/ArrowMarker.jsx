function ArrowMarker() {
	return (
		<defs>
			<marker
				id='arrow'
				markerWidth='10'
				markerHeight='10'
				refX='20'
				refY='5'
				orient='auto'
				markerUnits='strokeWidth'
			>
				<path d='M 0 0 L 10 5 L 0 10 z' fill='black' />
			</marker>
		</defs>
	);
}
export default ArrowMarker;
