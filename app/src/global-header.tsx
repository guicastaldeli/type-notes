import './styles/main/root/styles.scss';

export default function GlobalHeader() {
    return (
        <div id="-global-header">
            {/* Logo */}
            <div id="--logo-container">
                <div id="---logo-content">
                    <p>LOGO</p>
                </div>
            </div>

            {/* Search Bar */}
            <div id="--search-bar-container">
                <div id="---search-bar-content">
                    <p>search</p>
                    {/* create searchbartsx later... */}
                </div>
            </div>

            {/* info */}
            <div id='--bar-info'>info</div>
        </div>
    )
}