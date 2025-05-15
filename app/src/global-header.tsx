import './styles/main/styles.scss';

export default function GlobalHeader() {
    return (
        <div id="-global-header">
            <div id="--header-content">
                {/* Logo */}
                <div id="---logo-container">
                    <div id="_logo-content">
                        <p>LOGO</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div id="---search-bar-container">
                    <div id="_search-bar-content">
                        <p>search</p>
                        {/* create searchbartsx later... */}
                    </div>
                </div>

                {/* info */}
                <div id='---bar-info'>info</div>
            </div>
        </div>
    )
}